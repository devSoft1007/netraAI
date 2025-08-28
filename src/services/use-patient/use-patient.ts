import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import type { InsertPatient } from '@/shared/schema'

// Types for the Edge Function response
export interface Patient {
  id: string
  patient_id: string
  name: string
  email: string
  age: number | null
  phone: string
  insurance: string
  memberSince: string | null
  status: 'Active' | 'Inactive'
  isActive: boolean
  gender: string
  address: string
  medicalHistory: any
  initials: string
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PatientsFilters {
  search?: string
  status?: 'active' | 'inactive' | 'all'
}

export interface PatientsParams extends PatientsFilters {
  page?: number
  limit?: number
}

export interface PatientsResponse {
  success: boolean
  data: {
    patients: Patient[]
    pagination: PaginationInfo
    filters: PatientsFilters
  }
}

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
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      
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

// Hook for fetching patients using the get-patients Edge Function
export function usePatients(params: PatientsParams = {}) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ['patients', params],
    queryFn: async (): Promise<PatientsResponse> => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('No authenticated session found')
        }

        // Build URL with query parameters
        const url = new URL(`${process.env.SUPABASE_URL}/functions/v1/get-patients`)

        if (params.page) url.searchParams.set('page', params.page.toString())
        if (params.limit) url.searchParams.set('limit', params.limit.toString())
        if (params.search) url.searchParams.set('search', params.search)
        if (params.status) url.searchParams.set('status', params.status)

        // Use fetch directly for GET request
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch patients')
        }

        return data
      } catch (error: any) {
        console.error('Error fetching patients:', error)
        toast({
          title: "Error Fetching Patients",
          description: error.message || "Failed to fetch patients. Please try again.",
          variant: "destructive",
        })
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}


// Hook for fetching a single patient
export function usePatient(patientId: string) {
  return useSupabaseQuery('patients', '*', { id: patientId })
}
