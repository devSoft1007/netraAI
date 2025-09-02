import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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