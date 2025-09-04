import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { InsertInvoice, Invoice } from '@/shared/schema';

// Params for fetching invoices (extend as needed)
export interface InvoicesParams {
  patientId?: string;
  status?: string[];
  search?: string; // by invoice number
  limit?: number;
  offset?: number;
  from?: string; // due date from
  to?: string;   // due date to
  sort?: string; // due_date | created_at | total_amount
  dir?: 'asc' | 'desc';
}

export interface InvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  count: number;
  limit: number;
  offset: number;
  totalPages: number;
  page: number;
  hasMore: boolean;
}

// Hook to create an invoice via edge function (placeholder edge name: create-invoice)
export function useCreateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertInvoice) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session found');

      // Prepare payload (convert Dates to YYYY-MM-DD for date-only fields)
      const payload: Record<string, any> = { ...input };
      if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString().substring(0, 10);
      if (payload.paidDate instanceof Date) payload.paidDate = payload.paidDate.toISOString().substring(0, 10);
      // clinicId is not sent – backend derives it
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice Created', description: 'Invoice successfully created.' });
    },
    onError: (error: any) => {
      toast({ title: 'Invoice Creation Failed', description: error.message || 'Unable to create invoice.', variant: 'destructive' });
    }
  });
}

// Fetch invoices list (edge function placeholder: get-invoices)
export function useInvoices(params: InvoicesParams = {}) {
  // Keep hook for potential future toast usage
  useToast();
  return useQuery<InvoicesResponse, Error>({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session found');

      const baseUrl = `${supabaseUrl}/functions/v1/get-invoices`;
      const url = new URL(baseUrl);
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.offset) url.searchParams.set('offset', String(params.offset));
      if (params.patientId) url.searchParams.set('patientId', params.patientId);
      if (params.status?.length) url.searchParams.set('status', params.status.join(','));
      if (params.search) url.searchParams.set('search', params.search);
      if (params.from) url.searchParams.set('from', params.from);
      if (params.to) url.searchParams.set('to', params.to);
      if (params.sort) url.searchParams.set('sort', params.sort);
      if (params.dir) url.searchParams.set('dir', params.dir);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error(`Failed to fetch invoices (${res.status})`);
      const edgeData = await res.json();
      if (!edgeData.success) throw new Error(edgeData.error || 'Edge function error');

      const invoices: Invoice[] = (edgeData.invoices || []).map((inv: any) => ({
        id: inv.id,
        clinicId: inv.clinic_id,
        patientId: inv.patient_id,
        invoiceNumber: inv.invoice_number,
        totalAmount: Number(inv.total_amount),
        insuranceAmount: inv.insurance_amount != null ? Number(inv.insurance_amount) : undefined,
        patientAmount: inv.patient_amount != null ? Number(inv.patient_amount) : undefined,
        paymentMethod: inv.payment_method || undefined,
        status: inv.status,
        dueDate: inv.due_date ? new Date(inv.due_date) : new Date(),
        paidDate: inv.paid_date ? new Date(inv.paid_date) : undefined,
        createdAt: inv.created_at ? new Date(inv.created_at) : new Date(),
      }));

      const count = edgeData.count ?? invoices.length;
      const limit = edgeData.limit ?? params.limit ?? invoices.length;
      const offset = edgeData.offset ?? 0;
      const page = limit ? Math.floor(offset / limit) + 1 : 1;
      const totalPages = limit ? Math.max(1, Math.ceil(count / limit)) : 1;
      const hasMore = page < totalPages;
      return { success: true, invoices, count, limit, offset, page, totalPages, hasMore };
    },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 1,
  meta: { onErrorToast: true },
  });
}
