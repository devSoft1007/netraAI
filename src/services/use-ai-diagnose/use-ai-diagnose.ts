import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase, supabaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Types for the AI diagnosis storage
export interface AiDiagnosisData {
  aiResponse: {
    diabetic_retinopathy: {
      prediction: string
      confidence: number
      probabilities: Record<string, number>
      severity_level: number
      doctor_note: string
    }
    glaucoma: {
      prediction: string
      confidence: number
      probabilities: Record<string, number>
      severity_level: number
      doctor_note: string
    }
    meta: {
      request_id: string
      image_size: string
      model_version: string
      inference_time_ms: number
      input_source: string
      optimizations_applied: string[]
      timing: {
        image_loading_ms: number
        dr_prediction_ms: number
        glaucoma_prediction_ms: number
      }
    }
  }
  imageUrl: string
}

export interface StoreAiDiagnosisResponse {
  success: boolean
  analysis_id: string
  message: string
}

// Raw record as returned by the list analyses Edge Function (ai_analysis_results table)
interface RawAnalysisRecord {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id: string
  analyzed_by: string | null
  image_url: string | null
  image_metadata: any
  dr_prediction: string | null
  dr_confidence: number | null
  dr_probability: Record<string, number> | null
  glaucoma_prediction: string | null
  glaucoma_confidence: number | null
  glaucoma_probability: Record<string, number> | null
  risk_level: string | null
  clinical_notes: string | null
  status: string | null
  created_at: string
  updated_at: string | null
}

export interface ListAnalysesResponse {
  success: boolean
  count: number
  limit: number
  offset: number
  analyses: RawAnalysisRecord[]
}

// Hook for storing AI diagnosis using the store-analysis Edge Function
export function useStoreAiDiagnosis() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (diagnosisData: AiDiagnosisData) => {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      // Call the Supabase Edge Function to store the analysis
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/store-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diagnosisData),
      })

      if (!response.ok) {
        const text = await response.text()
        let parsed: any = {}
        try { parsed = JSON.parse(text) } catch { parsed = { message: text } }
        throw new Error(parsed?.error || parsed?.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to store AI diagnosis')
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate any relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['ai-diagnoses'] })
  // Expose last stored analysis id for feedback usage (imperative bridge)
  ;(window as any).__lastAnalysisId__ = data.analysis_id
      
      toast({
        title: "Analysis Stored Successfully",
        description: "AI diagnosis has been saved to the database.",
      })
      
      return data
    },
    onError: (error: any) => {
      console.error('Error storing AI diagnosis:', error)
      toast({
        title: "Error Storing Analysis",
        description: error.message || "Failed to store AI diagnosis. Please try again.",
        variant: "destructive",
      })
    },
  })
}

// Hook to list recent AI analyses using the Edge Function (READ)
// NOTE: Assumes Edge Function name is `list-analyses`. Adjust the path via env if needed.
export function useListAiAnalyses(limit: number = 5) {
  const { toast } = useToast()
  return useQuery<{ id: string; patientId: string; imageUrl: string; diagnosis: string; confidence: number; severity: 'normal' | 'mild' | 'moderate' | 'severe'; recommendations: string[]; analyzedBy: string; reviewedByDoctor: boolean; doctorNotes?: string; createdAt: Date; }[]>({
    queryKey: ['ai-diagnoses', { limit }],
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No authenticated session found')

        const url = `${supabaseUrl}/functions/v1/list-doctor-analysis?limit=${limit}`

        const res = await fetch(url, {
          method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
        })
        if (!res.ok) {
          const text = await res.text()
          let parsed: any = {}
          try { parsed = JSON.parse(text) } catch { parsed = { message: text } }
          throw new Error(parsed?.error || parsed?.message || `HTTP error ${res.status}`)
        }
        const data: ListAnalysesResponse = await res.json()
        if (!data.success) throw new Error('Failed to fetch analyses')
        return data.analyses.map(rec => ({
          id: rec.id,
          patientId: rec.patient_id,
          imageUrl: rec.image_url || '',
          diagnosis: buildDiagnosisSummary(rec),
          confidence: deriveConfidence(rec),
          severity: deriveSeverity(rec),
          recommendations: [],
          analyzedBy: rec.analyzed_by || 'AI Model',
          reviewedByDoctor: (rec.status || '').toLowerCase().includes('review'),
          doctorNotes: rec.clinical_notes || undefined,
          createdAt: new Date(rec.created_at)
        }))
      } catch (err: any) {
        toast({ title: 'Failed to load analyses', description: err.message, variant: 'destructive' })
        throw err
      }
    }
  })
}

// Helper: combine predictions into a concise diagnosis string
function buildDiagnosisSummary(r: RawAnalysisRecord): string {
  const parts: string[] = []
  const drMsg = formatDiseaseMessage(r.dr_prediction, 'dr')
  const glMsg = formatDiseaseMessage(r.glaucoma_prediction, 'glaucoma')
  if (drMsg) parts.push(drMsg)
  if (glMsg) parts.push(glMsg)
  return parts.join(' | ') || 'Analysis'
}

function formatDiseaseMessage(pred: string | null, kind: 'dr' | 'glaucoma'): string | null {
  if (!pred) return null
  const raw = pred.replace(/_/g, ' ').trim().toLowerCase()
  const isNone = /^(no|none|negative)/.test(raw) || raw.includes('no ') || raw === 'normal'
  if (kind === 'dr') {
    if (isNone) return 'No diabetic retinopathy detected'
    // Structured mapping for DR variants
    if (/pdr|proliferative/.test(raw)) {
      return 'Proliferative diabetic retinopathy detected'
    }
    if (/npdr|non.?proliferative/.test(raw)) {
      const sevMatch = raw.match(/mild|moderate|severe/)
      const sev = sevMatch ? capitalizeFirst(sevMatch[0]) + ' ' : ''
      return `${sev}non-proliferative diabetic retinopathy detected`.trim()
    }
    if (/background/.test(raw)) {
      return 'Background diabetic retinopathy detected'
    }
    // Generic fallback (avoid repeating 'diabetic retinopathy' if already present)
    if (raw.includes('diabetic') && raw.includes('retinopathy')) {
      return capitalizeFirst(raw)
    }
    const severity = capitalizeFirst(raw)
    return `${severity} diabetic retinopathy detected`
  } else {
    if (isNone) return 'No glaucoma detected'
    // Common model outputs could be: glaucoma, suspect, likely glaucoma, early, moderate, severe
    const cleaned = capitalizeFirst(raw.replace(/glaucoma/g, '').trim())
    if (cleaned.toLowerCase().startsWith('suspect')) return 'Glaucoma suspect – further evaluation recommended'
    if (cleaned.toLowerCase().includes('risk')) return 'Glaucoma risk detected'
    const base = cleaned ? `${cleaned} glaucoma detected` : 'Glaucoma detected'
    return base
  }
}

function capitalizeFirst(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

// Helper: derive a single confidence (%) from two models
function deriveConfidence(r: RawAnalysisRecord): number {
  const values = [r.dr_confidence, r.glaucoma_confidence].filter(v => typeof v === 'number') as number[]
  if (!values.length) return 0
  // Convert 0-1 to percentage if appears to be <=1
  const normed = values.map(v => v <= 1 ? v * 100 : v)
  // Use max to reflect highest certainty finding
  return Math.round(Math.max(...normed))
}

// Helper: ensure severity matches enum expected by UI
function deriveSeverity(r: RawAnalysisRecord): 'normal' | 'mild' | 'moderate' | 'severe' {
  const risk = (r.risk_level || '').toLowerCase()
  if (risk === 'mild') return 'mild'
  if (risk === 'moderate') return 'moderate'
  if (risk === 'severe' || risk === 'high' || risk === 'critical') return 'severe'
  return 'normal'
}