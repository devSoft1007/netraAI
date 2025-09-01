
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Appointment } from '@/shared/schema'

// Types describing the appointment payload expected by the edge function
export interface ProcedureInput {
	id?: string // when attaching existing procedure templates from frontend
	procedureName?: string
	description?: string | null
	performedDate?: string | null
	duration?: number | null
	cost?: number | null
	status?: string | null
	notes?: string | null
}

export interface InsertAppointment {
	patient: { id: string }
	doctor: { id: string }
	appointmentDate: string
	appointmentTime: string
	duration?: number
	appointmentType?: string
	reason?: string | null
	notes?: string | null
	status?: string
	procedures: ProcedureInput[]
}

export interface AddAppointmentResponse {
	success: boolean
	message?: string
	appointment?: any
}

// Hook for adding an appointment using Supabase Edge Function
export function useAddAppointment() {
	const queryClient = useQueryClient()
	const { toast } = useToast()

	return useMutation({
		mutationFn: async (appointmentData: InsertAppointment) => {
			// Get current session to include auth token
			const { data: { session } } = await supabase.auth.getSession()

			if (!session) {
				throw new Error('No authenticated session found')
			}

			// Call the Supabase Edge Function
			const { data, error } = await supabase.functions.invoke('create-appointment', {
				body: appointmentData,
				headers: {
					Authorization: `Bearer ${session.access_token}`,
				},
			})

			if (error) {
				throw error
			}

			return data as AddAppointmentResponse
		},
		onSuccess: (data) => {
			// Invalidate appointments queries to refetch the list
			queryClient.invalidateQueries({ queryKey: ['appointments'] })

			toast({
				title: 'Appointment Created',
				description: data?.message || 'New appointment has been scheduled.',
			})

			return data
		},
		onError: (error: any) => {
			console.error('Error adding appointment:', error)
			toast({
				title: 'Error Creating Appointment',
				description: error?.message || 'Failed to create appointment. Please try again.',
				variant: 'destructive',
			})
		},
	})
}

// Define the parameters for the get-appointments function
export interface GetAppointmentsParams {
  start: string // ISO-8601 date or date-time
  end: string   // ISO-8601 date or date-time
  view?: 'month' | 'week' | 'day' // Optional - for future use
  status?: string[] // Optional - comma-separated list of statuses
  limit?: number    // Optional - pagination limit (10-500)
}

// Define the response structure from the edge function
export interface GetAppointmentsResponse {
  success: boolean
  data: Appointment[]
}

// Hook for fetching appointments using the Supabase Edge Function
export function useAppointmentQuery(params: GetAppointmentsParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No authenticated session found')
      }

      // Construct query parameters
      const searchParams = new URLSearchParams({
        start: params.start,
        end: params.end,
        ...(params.view && { view: params.view }),
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.status && params.status.length > 0 && { 
          status: params.status.join(',') 
        }),
      })

      // Call the Supabase Edge Function
      // Using fetch directly to have more control over query parameters
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-appointments?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch appointments')
      }

      return result.data as Appointment[]
    },
    // Only enable the query if we have required parameters
    enabled: !!params.start && !!params.end,
    // Cache appointments for 5 minutes by default
    staleTime: 1000 * 60 * 5,
  })
}

// Hook for updating an appointment using the Supabase Edge Function
export function useUpdateAppointment() {
	const queryClient = useQueryClient()
	const { toast } = useToast()

	return useMutation({
		mutationFn: async ({ appointmentId, data }: { appointmentId: string; data: any }) => {
			// Get current session to include auth token
			const { data: { session } } = await supabase.auth.getSession()

			if (!session) {
				throw new Error('No authenticated session found')
			}

			const response = await fetch(`${supabaseUrl}/functions/v1/update-appointment/${appointmentId}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const errText = await response.text()
				throw new Error(`HTTP error ${response.status}: ${errText}`)
			}

			const result = await response.json()

			if (!result.success) {
				throw new Error(result.error || 'Failed to update appointment')
			}

			return result
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['appointments'] })

			toast({
				title: 'Appointment Updated',
				description: data?.message || 'Appointment updated successfully.',
			})

			return data
		},
		onError: (error: any) => {
			console.error('Error updating appointment:', error)
			toast({
				title: 'Error Updating Appointment',
				description: error?.message || 'Failed to update appointment. Please try again.',
				variant: 'destructive',
			})
		},
	})
}
