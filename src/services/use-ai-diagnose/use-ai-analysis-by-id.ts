import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Raw record shape returned by the Edge Function (ai_analysis_results)
interface RawAnalysisByIdRecord {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id: string | null
  analyzed_by: string | null
  image_url: string | null
  image_metadata: any
  dr_prediction: string | null
  dr_confidence: number | null
  dr_probability: Record<string, number> | string | null
  dr_severity_level: number | null
  dr_doctor_note: string | null
  glaucoma_prediction: string | null
  glaucoma_confidence: number | null
  glaucoma_probability: Record<string, number> | string | number | null
  glaucoma_severity_level: number | null
  glaucoma_doctor_note: string | null
  risk_level: string | null
  clinical_notes: string | null
  status: string | null
  created_at: string
  updated_at: string | null
}

export interface AiAnalysisDetail {
  id: string
  patientId: string
  imageUrl: string
  diagnosis: string
  confidence: number
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
  analyzedBy: string
  reviewedByDoctor: boolean
  doctorNotes?: string
  createdAt: Date
  // Extended fields
  drPrediction?: string | null
  drConfidence?: number | null
  drProbability?: Record<string, number> | null
  drDoctorNote?: string | null
  drSeverityLevel?: number | null
  glaucomaPrediction?: string | null
  glaucomaConfidence?: number | null
  glaucomaProbability?: Record<string, number> | null
  glaucomaDoctorNote?: string | null
  glaucomaSeverityLevel?: number | null
  riskLevel?: string | null
  status?: string | null
  imageMetadata?: any
}

interface EdgeFunctionSuccessPayload { success: true; analysis: RawAnalysisByIdRecord }
interface EdgeFunctionErrorPayload { error: string; context?: string }

type EdgeFunctionResponse = EdgeFunctionSuccessPayload | EdgeFunctionErrorPayload

// Hook to fetch a single AI analysis by ID via Edge Function (GET /functions/v1/get-analysis/:id)
export function useAiAnalysisById(analysisId?: string) {
  const { toast } = useToast()

  return useQuery<AiAnalysisDetail | null>({
    queryKey: ['ai-analysis', analysisId],
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AiAnalysisDetail | null> => {
      if (!analysisId) return null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No authenticated session found')

  const url = `${supabaseUrl}/functions/v1/get-analysis-by-id/${analysisId}`
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        const text = await res.text()
        let parsed: EdgeFunctionResponse
        try { parsed = JSON.parse(text) } catch { throw new Error(`Unexpected response (${res.status})`) }
        if (!res.ok || 'error' in parsed) {
          throw new Error((parsed as EdgeFunctionErrorPayload).error || `HTTP ${res.status}`)
        }
        const rec = (parsed as EdgeFunctionSuccessPayload).analysis
        return mapRecord(rec)
      } catch (err: any) {
        toast({ title: 'Failed to load analysis', description: err.message, variant: 'destructive' })
        throw err
      }
    }
  })
}

// ---- Mapping & Helpers ----
function mapRecord(r: RawAnalysisByIdRecord): AiAnalysisDetail {
  return {
    id: r.id,
    patientId: r.patient_id,
    imageUrl: r.image_url || '',
    diagnosis: buildDiagnosisSummary(r),
    confidence: deriveConfidence(r),
    severity: deriveSeverity(r),
    analyzedBy: r.analyzed_by || 'AI Model',
    reviewedByDoctor: (r.status || '').toLowerCase().includes('review'),
    doctorNotes: r.clinical_notes || undefined,
    createdAt: new Date(r.created_at),
    drPrediction: r.dr_prediction,
    drConfidence: normalizeConfidence(r.dr_confidence),
    drProbability: normalizeProbability(r.dr_probability),
  drDoctorNote: r.dr_doctor_note,
  drSeverityLevel: r.dr_severity_level,
    glaucomaPrediction: r.glaucoma_prediction,
    glaucomaConfidence: normalizeConfidence(r.glaucoma_confidence),
    glaucomaProbability: deriveGlaucomaProbability(r),
  glaucomaDoctorNote: r.glaucoma_doctor_note,
  glaucomaSeverityLevel: r.glaucoma_severity_level,
    riskLevel: r.risk_level,
  status: r.status,
  imageMetadata: r.image_metadata
  }
}

function buildDiagnosisSummary(r: RawAnalysisByIdRecord): string {
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
    if (/pdr|proliferative/.test(raw)) return 'Proliferative diabetic retinopathy detected'
    if (/npdr|non.?proliferative/.test(raw)) {
      const sevMatch = raw.match(/mild|moderate|severe/)
      const sev = sevMatch ? capitalizeFirst(sevMatch[0]) + ' ' : ''
      return `${sev}non-proliferative diabetic retinopathy detected`.trim()
    }
    if (/background/.test(raw)) return 'Background diabetic retinopathy detected'
    if (raw.includes('diabetic') && raw.includes('retinopathy')) return capitalizeFirst(raw)
    const severity = capitalizeFirst(raw)
    return `${severity} diabetic retinopathy detected`
  } else {
    if (isNone) return 'No glaucoma detected'
    const cleaned = capitalizeFirst(raw.replace(/glaucoma/g, '').trim())
    if (cleaned.toLowerCase().startsWith('suspect')) return 'Glaucoma suspect – further evaluation recommended'
    if (cleaned.toLowerCase().includes('risk')) return 'Glaucoma risk detected'
    const base = cleaned ? `${cleaned} glaucoma detected` : 'Glaucoma detected'
    return base
  }
}

function capitalizeFirst(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

function deriveConfidence(r: RawAnalysisByIdRecord): number {
  const values = [normalizeConfidence(r.dr_confidence), normalizeConfidence(r.glaucoma_confidence)].filter(v => typeof v === 'number') as number[]
  if (!values.length) return 0
  return Math.round(Math.max(...values))
}

function normalizeConfidence(v: number | null): number | null {
  if (v == null) return null
  return v <= 1 ? v * 100 : v
}

function deriveSeverity(r: RawAnalysisByIdRecord): 'normal' | 'mild' | 'moderate' | 'severe' {
  const risk = (r.risk_level || '').toLowerCase()
  if (risk === 'mild') return 'mild'
  if (risk === 'moderate') return 'moderate'
  if (['severe','high','critical'].includes(risk)) return 'severe'
  return 'normal'
}

function normalizeProbability(input: any): Record<string, number> | null {
  if (!input) return null
  let obj = input
  if (typeof input === 'string') {
    try { obj = JSON.parse(input) } catch { return null }
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) return null
  const out: Record<string, number> = {}
  for (const [k,v] of Object.entries(obj)) {
    const num = typeof v === 'number' ? v : parseFloat(String(v))
    if (!Number.isNaN(num)) out[k] = num
  }
  return Object.keys(out).length ? out : null
}

function deriveGlaucomaProbability(r: RawAnalysisByIdRecord): Record<string, number> | null {
  const raw = r.glaucoma_probability
  if (raw && (typeof raw === 'object' || (typeof raw === 'string' && (raw as string).trim().startsWith('{')))) {
    return normalizeProbability(raw)
  }
  if (typeof raw === 'number') {
    const other = raw
    let predicted = r.glaucoma_confidence
    if (typeof predicted !== 'number') predicted = 1 - other
    const pPred = clamp(predicted!)
    const pOther = clamp(other)
    const sum = pPred + pOther
    const normPred = sum > 0 ? pPred / sum : 0
    const normOther = sum > 0 ? pOther / sum : 0
    const predictionLabel = (r.glaucoma_prediction || '').toLowerCase()
    const isNormal = predictionLabel === 'normal' || predictionLabel.includes('normal')
    if (isNormal) return { Normal: normPred, Glaucoma: normOther }
    return { Glaucoma: normPred, Normal: normOther }
  }
  return null
}

function clamp(v: number) { return Math.min(Math.max(v, 0), 1) }
