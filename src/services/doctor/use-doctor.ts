
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseQuery } from '@/hooks/useSupabase'

export interface Doctor {
	id: string
	name: string
	specialization: string | null
	licenseNumber: string | null
	email: string | null
	phone: string | null
	status: 'Active' | 'Inactive'
	isActive: boolean
	joinedDate: string | null
	lastUpdated: string | null
	initials: string
	displayName: string
	availableForAppointments: boolean
	specializationShort: string
}

export interface DoctorsParams {
	includeInactive?: boolean
	specialization?: string
}

export interface DoctorsResponse {
	success: boolean
	data: {
		doctors: Doctor[]
		doctorsBySpecialization: Record<string, Doctor[]>
		clinic: any | null
		stats: {
			total: number
			active: number
			inactive: number
			specializations: number
		}
		filters: {
			includeInactive: boolean
			specialization: string | null
		}
	}
}

// Hook for fetching doctors using the get-doctors Edge Function
export function useDoctors(params: DoctorsParams = {}) {
	const { toast } = useToast()

	return useQuery({
		queryKey: ['doctors', params],
		queryFn: async (): Promise<DoctorsResponse> => {
			try {
				const { data: { session } } = await supabase.auth.getSession()

				if (!session) {
					throw new Error('No authenticated session found')
				}

				const url = new URL(`${process.env.SUPABASE_URL}/functions/v1/get-doctors-by-clinic-id`)

				if (params.includeInactive) url.searchParams.set('include_inactive', 'true')
				if (params.specialization) url.searchParams.set('specialization', params.specialization)

				const res = await fetch(url.toString(), {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${session.access_token}`,
						'Content-Type': 'application/json',
					},
				})

				if (!res.ok) {
					const text = await res.text()
					let parsed: any = {}
					try { parsed = JSON.parse(text) } catch { parsed = { message: text } }
					throw new Error(parsed?.error || parsed?.message || `HTTP error ${res.status}`)
				}

				const data = await res.json()
				if (!data.success) {
					throw new Error(data.error || 'Failed to fetch doctors')
				}

				return data
			} catch (error: any) {
				console.error('Error fetching doctors:', error)
				toast({
					title: 'Error Fetching Doctors',
					description: error?.message || 'Failed to fetch doctors. Please try again.',
					variant: 'destructive',
				})
				throw error
			}
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
	})
}

// Hook for fetching a single doctor using Supabase client-side query
export function useDoctorById(doctorId?: string) {
	return useSupabaseQuery('doctors', '*', { id: doctorId })
}
