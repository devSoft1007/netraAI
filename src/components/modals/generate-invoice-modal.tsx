import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar as CalendarIcon, Hash, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients } from '@/services/use-patient';
import { insertInvoiceSchema, type InsertInvoice } from '@/shared/schema';
import { useCreateInvoice } from '@/services/use-invoices';
import { useToast } from '@/hooks/use-toast';

// (Optional) Could extend with additional UI-only fields later.

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (invoice: any) => void; // callback after successful creation
}

// Utility to generate a readable invoice number suggestion
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900); // 3 digit
  return `INV-${year}-${rand}`;
}

export default function GenerateInvoiceModal({ isOpen, onClose, onCreate }: GenerateInvoiceModalProps) {
  const { data: patientsData, isLoading: loadingPatients } = usePatients({ page: 1, limit: 100 });
  const patients = patientsData?.data?.patients || [];
  useToast(); // toast currently unused; keep hook call for potential future notifications
  const createInvoice = useCreateInvoice();

  const form = useForm<InsertInvoice & { insuranceAmount?: number; patientAmount?: number }>({
    resolver: zodResolver(insertInvoiceSchema as any),
    defaultValues: {
      patientId: '',
      invoiceNumber: generateInvoiceNumber(),
      totalAmount: 0,
      insuranceAmount: undefined,
      patientAmount: undefined,
      paymentMethod: 'cash',
      status: 'pending',
      dueDate: undefined,
      paidDate: undefined,
    }
  });

  // Regenerate invoice number when modal opens fresh
  useEffect(() => {
    if (isOpen) {
      form.reset({
        patientId: '',
        invoiceNumber: generateInvoiceNumber(),
        totalAmount: 0,
        insuranceAmount: undefined,
        patientAmount: undefined,
        paymentMethod: 'cash',
        status: 'pending',
        dueDate: undefined,
        paidDate: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: any) => {
    const payload: InsertInvoice = {
      patientId: data.patientId,
      invoiceNumber: data.invoiceNumber,
      totalAmount: Number(data.totalAmount || 0),
      insuranceAmount: data.insuranceAmount != null ? Number(data.insuranceAmount) : undefined,
      patientAmount: data.patientAmount != null ? Number(data.patientAmount) : undefined,
      paymentMethod: data.paymentMethod || undefined,
      status: data.status,
      dueDate: data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate),
      paidDate: data.paidDate instanceof Date ? data.paidDate : undefined,
    } as InsertInvoice; // clinicId & createdAt supplied by backend

    createInvoice.mutate(payload, {
      onSuccess: (res) => {
        onCreate?.(res);
        handleClose();
      }
    });
  };

  // Auto-calc patientAmount if insuranceAmount entered and patientAmount empty
  const watchTotal = form.watch('totalAmount');
  const watchInsurance = form.watch('insuranceAmount');
  const watchPatient = form.watch('patientAmount');
  if (watchTotal && watchInsurance != null && (watchPatient == null || watchPatient === undefined)) {
    const remaining = Number(watchTotal) - Number(watchInsurance);
    if (remaining >= 0) {
      setTimeout(() => form.setValue('patientAmount', remaining));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <FileText className="h-5 w-5 text-medical-blue" />
            <span>Create Invoice</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-medical-blue">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPatients}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder={loadingPatients ? 'Loading patients...' : 'Select patient'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Hash className="h-4 w-4" />
                          <span>Invoice Number *</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due Date *</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (INR) *</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" value={field.value} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insuranceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="patientAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" className="medical-button-primary" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? 'Creating...' : 'Generate'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
