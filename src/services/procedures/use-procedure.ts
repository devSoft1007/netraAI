import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface Procedure {
  id: string
  procedureName: string
  description: string | null
  doctorName: string | null
  performedDate: string | null
  duration: number | null
  cost: number | null
  status: string
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
  patient: { id: string; name: string } | null
  appointment: { id: string; date: string | null; time: string | null } | null
  isStandalone: boolean
  isLinked: boolean
  formattedCost: string | null
  formattedDate: string | null
  statusBadge: string
  durationFormatted: string | null
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProceduresFilters {
  search?: string
  status?: string
  doctorName?: string
  procedureName?: string
  dateFrom?: string
  dateTo?: string
  minCost?: string
  maxCost?: string
  includeStandalone?: boolean
  linkedOnly?: boolean
}

export interface ProceduresParams extends ProceduresFilters {
  page?: number
  limit?: number
}

export interface ProceduresResponse {
  success: boolean
  data: {
    procedures: Procedure[]
    proceduresByStatus: Record<string, Procedure[]>
    pagination: PaginationInfo
    filters: ProceduresFilters
    stats: any
  }
}

// Hook for fetching procedures using the get-procedures Edge Function
export function useProcedures(params: ProceduresParams = {}) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ['procedures', params],
    queryFn: async (): Promise<ProceduresResponse> => {
      try {
        // Ensure we have a current session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No authenticated session found')

        const url = new URL(`${process.env.SUPABASE_URL}/functions/v1/get-procedures`)

        if (params.page) url.searchParams.set('page', params.page.toString())
        if (params.limit) url.searchParams.set('limit', params.limit.toString())
        if (params.search) url.searchParams.set('search', params.search)
        if (params.status) url.searchParams.set('status', params.status)
        if (params.doctorName) url.searchParams.set('doctor_name', params.doctorName)
        if (params.procedureName) url.searchParams.set('procedure_name', params.procedureName)
        if (params.dateFrom) url.searchParams.set('date_from', params.dateFrom)
        if (params.dateTo) url.searchParams.set('date_to', params.dateTo)
        if (params.minCost) url.searchParams.set('min_cost', params.minCost)
        if (params.maxCost) url.searchParams.set('max_cost', params.maxCost)
        if (typeof params.includeStandalone !== 'undefined') url.searchParams.set('include_standalone', String(params.includeStandalone))
        if (typeof params.linkedOnly !== 'undefined') url.searchParams.set('linked_only', String(params.linkedOnly))

        const res = await fetch(url.toString(), {
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

        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch procedures')

        return data
      } catch (error: any) {
        console.error('Error fetching procedures:', error)
        toast({
          title: 'Error Fetching Procedures',
          description: error?.message || 'Failed to fetch procedures. Please try again.',
          variant: 'destructive'
        })
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  })
}

export default useProcedures
