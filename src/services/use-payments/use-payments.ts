import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { InsertPayment } from '@/shared/schema';

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
			queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
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
