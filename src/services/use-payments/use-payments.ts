import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { InsertPayment } from '@/shared/schema';
import type { Payment } from '@/shared/schema';

// Hook for adding a payment using Supabase Edge Function
export function useAddPayment() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (paymentData: InsertPayment) => {
			// Get the current session to include auth token
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				throw new Error('No authenticated session found');
			}
			// Call the Supabase Edge Function for payments
			const { data, error } = await supabase.functions.invoke('create-payment', {
				body: paymentData,
				headers: {
					Authorization: `Bearer ${session.access_token}`,
				},
			});
			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: (data) => {
			// Invalidate payments queries to refetch the list
			queryClient.invalidateQueries({ queryKey: ['payments'] });
			toast({
				title: 'Payment Recorded',
				description: 'The payment has been added successfully.',
			});
			return data;
		},
		onError: (error) => {
			console.error('Error adding payment:', error);
			toast({
				title: 'Payment Failed',
				description: error.message || 'Unable to record payment.',
				variant: 'destructive',
			});
		},
	});
}

// Hook for updating a payment (limited editable fields per Edge Function contract)
interface UpdatePaymentInput {
	id: string; // payment id
	amount?: number;
	paymentMethod?: string;
	paymentStatus?: string; // maps to 'status' in edge function
	paymentDate?: Date | string;
}

export function useUpdatePayment() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (input: UpdatePaymentInput) => {
			const { id, amount, paymentMethod, paymentStatus, paymentDate } = input;
			if (!id) throw new Error('Payment id required');
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) throw new Error('No authenticated session found');

			const body: Record<string, any> = {};
			if (amount != null) body.amount = amount;
			if (paymentMethod) body.paymentMethod = paymentMethod;
			if (paymentStatus) body.status = paymentStatus; // edge expects 'status'
			if (paymentDate) {
				const d = typeof paymentDate === 'string' ? paymentDate : paymentDate.toISOString().substring(0,10);
				body.paymentDate = d; // edge will validate YYYY-MM-DD
			}

			if (Object.keys(body).length === 0) {
				throw new Error('No update fields provided');
			}

			const url = `${supabaseUrl}/functions/v1/update-payment/${id}`;
			const res = await fetch(url, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || `Failed to update payment (${res.status})`);
			}
			const data = await res.json();
			if (!data.success) throw new Error(data.error || 'Update failed');
			return data.payment;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['payments'] });
			toast({ title: 'Payment Updated', description: 'Changes saved successfully.' });
		},
		onError: (error: any) => {
			console.error('Error updating payment:', error);
			toast({ title: 'Update Failed', description: error.message || 'Unable to update payment.', variant: 'destructive' });
		}
	});
}

// Params for fetching payments
export interface PaymentsParams {
	limit?: number;
	offset?: number;
	status?: string[]; // ['paid','pending']
	method?: string[]; // ['cash','card']
	from?: string; // YYYY-MM-DD
	to?: string;   // YYYY-MM-DD
	patientId?: string;
	invoiceNumber?: string;
	sort?: string; // payment_date, amount, etc.
	dir?: 'asc' | 'desc';
}

export interface PaymentsResponse {
	success: boolean;
	count: number;
	limit: number;
	offset: number;
	filters: Record<string, any>;
	payments: Payment[];
	hasMore: boolean;
	page: number;
	totalPages: number;
}

// Hook for fetching payments via Edge Function (get-payments)
export function usePayments(params: PaymentsParams = {}) {
	const { toast } = useToast();

	return useQuery<PaymentsResponse>({
		queryKey: [
			'payments',
			params.limit ?? null,
			params.offset ?? 0,
			(params.status || []).join(','),
			(params.method || []).join(','),
			params.from ?? null,
			params.to ?? null,
			params.invoiceNumber ?? null,
			params.sort ?? 'payment_date',
			params.dir ?? 'desc'
		],
		queryFn: async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (!session) throw new Error('No authenticated session found');

				const baseUrl = `${supabaseUrl}/functions/v1/get-payments`;
				const url = new URL(baseUrl);
				if (params.limit) url.searchParams.set('limit', String(params.limit));
				if (params.offset) url.searchParams.set('offset', String(params.offset));
				if (params.status?.length) url.searchParams.set('status', params.status.join(','));
				if (params.method?.length) url.searchParams.set('method', params.method.join(','));
				if (params.from) url.searchParams.set('from', params.from);
				if (params.to) url.searchParams.set('to', params.to);
				if (params.patientId) url.searchParams.set('patientId', params.patientId);
				if (params.invoiceNumber) url.searchParams.set('invoiceNumber', params.invoiceNumber);
				if (params.sort) url.searchParams.set('sort', params.sort);
				if (params.dir) url.searchParams.set('dir', params.dir);

				const res = await fetch(url.toString(), {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${session.access_token}`,
						'Content-Type': 'application/json',
					},
				});
				if (!res.ok) {
						throw new Error(`HTTP error! status: ${res.status}`);
				}
				const edgeData = await res.json();
				if (!edgeData.success) {
					throw new Error(edgeData.error || 'Failed to fetch payments');
				}

				// Transform edge payments to match Payment schema
				const payments: Payment[] = (edgeData.payments || []).map((p: any) => ({
					id: p.id,
					patientId: p.patient?.id || '',
					appointmentId: undefined,
					procedureId: undefined,
						amount: p.amount,
					paymentMethod: p.payment_method,
					paymentStatus: p.status,
					insuranceClaim: false,
					insuranceAmount: undefined,
					patientAmount: undefined,
					paymentDate: p.payment_date ? new Date(p.payment_date) : undefined,
					dueDate: p.invoice?.due_date ? new Date(p.invoice.due_date) : undefined,
					invoiceNumber: p.invoice?.number,
					createdAt: p.created_at ? new Date(p.created_at) : new Date(),
					updatedAt: p.created_at ? new Date(p.created_at) : new Date(),
				}));

				const totalCount = edgeData.count ?? 0;
				const page = edgeData.limit ? Math.floor(edgeData.offset / edgeData.limit) + 1 : 1;
				const totalPages = edgeData.limit ? Math.max(1, Math.ceil(totalCount / edgeData.limit)) : 1;
				const hasMore = page < totalPages;
				return {
					success: true,
					count: totalCount,
					limit: edgeData.limit,
					offset: edgeData.offset,
					filters: edgeData.filters,
					payments,
					hasMore,
					page,
					totalPages,
				};
			} catch (error: any) {
				console.error('Error fetching payments:', error);
				toast({
					title: 'Error Fetching Payments',
					description: error.message || 'Failed to fetch payments. Please try again.',
					variant: 'destructive',
				});
				throw error;
			}
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
	});
}
