import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import type { InsertPatient } from '@/shared/schema'

// Hook for adding a patient using Supabase Edge Function
export function useAddPatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (patientData: InsertPatient) => {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('add-patient', {
        body: patientData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate patients queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ['supabase', 'patients'] })
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] })
      
      toast({
        title: "Patient Added Successfully",
        description: "New patient has been registered in the system.",
      })
      
      return data
    },
    onError: (error: any) => {
      console.error('Error adding patient:', error)
      toast({
        title: "Error Adding Patient",
        description: error.message || "Failed to add new patient. Please try again.",
        variant: "destructive",
      })
    },
  })
}

// Hook for fetching patients using the existing useSupabaseQuery
export function usePatients() {
  // Use the existing useSupabaseQuery hook from useSupabase.ts
  // This assumes you have a 'patients' table in your database
  return useSupabaseQuery('patients', '*')
}

// Hook for fetching a single patient
export function usePatient(patientId: string) {
  return useSupabaseQuery('patients', '*', { id: patientId })
}
