
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
