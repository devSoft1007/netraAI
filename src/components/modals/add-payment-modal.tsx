import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, Calendar as CalendarIcon, Hash } from "lucide-react";
import { insertPaymentSchema, type InsertPayment } from "@/shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/services/use-patient";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPaymentModal({ isOpen, onClose }: AddPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: patientsData, isLoading: loadingPatients } = usePatients();
  const patients = patientsData?.data?.patients || [];

  const form = useForm<InsertPayment>({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      patientId: "",
      amount: 0,
      paymentMethod: "cash",
      paymentStatus: "pending",
      insuranceClaim: false,
      insuranceAmount: undefined,
      patientAmount: undefined,
      paymentDate: undefined,
      dueDate: undefined,
      invoiceNumber: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      // Convert potential Date objects to ISO
      const payload: any = { ...data };
      if (payload.paymentDate instanceof Date) payload.paymentDate = payload.paymentDate.toISOString();
      if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();
      // Strip empty optional values
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "" || payload[k] === null) delete payload[k];
      });
      const res = await apiRequest("POST", "/api/payments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Payment Recorded", description: "The payment has been added successfully." });
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Payment Failed", description: err.message || "Unable to record payment.", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertPayment) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Auto derive patientAmount if insuranceAmount set and patientAmount empty
  const watchAmount = form.watch("amount");
  const watchInsurance = form.watch("insuranceClaim");
  const watchInsuranceAmount = form.watch("insuranceAmount");
  const watchPatientAmount = form.watch("patientAmount");
  if (watchInsurance && watchInsuranceAmount && !watchPatientAmount) {
    const remaining = Number(watchAmount || 0) - Number(watchInsuranceAmount || 0);
    if (remaining >= 0 && watchAmount) {
      // set after render cycle to avoid uncontrolled -> controlled warnings
      setTimeout(() => form.setValue("patientAmount", remaining));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <DollarSign className="h-5 w-5 text-medical-blue" />
            <span>Add Payment</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-medical-blue">Payment Details</CardTitle>
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
                            <SelectTrigger>
                              <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select patient"} />
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD) *</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" value={field.value} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Payment Date</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value ? (field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value) : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due Date</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value ? (field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value) : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="insuranceClaim"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                          <FormLabel className="text-sm">Insurance Claim</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {watchInsurance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="insuranceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Amount</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="patientAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Amount</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <Hash className="h-4 w-4" />
                        <span>Invoice Number</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="INV-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" className="medical-button-primary" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Add Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
