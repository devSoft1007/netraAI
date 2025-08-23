import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon, Clock, User, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProcedureSchema, type Procedure, type InsertProcedure, type Patient } from "@shared/schema";
import { format } from "date-fns";

interface EditProcedureModalProps {
  procedure: Procedure | null;
  patients: Patient[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProcedureModal({
  procedure,
  patients,
  isOpen,
  onClose,
}: EditProcedureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProcedure>({
    resolver: zodResolver(insertProcedureSchema),
    defaultValues: {
      patientId: procedure?.patientId || "",
      procedureName: procedure?.procedureName || "",
      doctorName: procedure?.doctorName || "",
      performedDate: procedure ? new Date(procedure.performedDate) : new Date(),
      duration: procedure?.duration || 0,
      status: procedure?.status || "scheduled",
      description: procedure?.description || "",
      notes: procedure?.notes || "",
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: async (data: InsertProcedure) => {
      const response = await apiRequest('PATCH', `/api/procedures/${procedure?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procedures'] });
      toast({
        title: "Procedure Updated",
        description: "The procedure has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the procedure. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProcedure) => {
    updateProcedureMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!procedure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <Activity className="h-5 w-5 text-medical-blue" />
            <span>Edit Procedure</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Procedure Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-medical-blue">Procedure Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Patient *</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients?.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName} - {patient.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="procedureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select procedure type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cataract Surgery">Cataract Surgery</SelectItem>
                          <SelectItem value="LASIK Surgery">LASIK Surgery</SelectItem>
                          <SelectItem value="Retinal Detachment Repair">Retinal Detachment Repair</SelectItem>
                          <SelectItem value="Glaucoma Surgery">Glaucoma Surgery</SelectItem>
                          <SelectItem value="Corneal Transplant">Corneal Transplant</SelectItem>
                          <SelectItem value="Vitrectomy">Vitrectomy</SelectItem>
                          <SelectItem value="Macular Degeneration Treatment">Macular Degeneration Treatment</SelectItem>
                          <SelectItem value="Diabetic Retinopathy Treatment">Diabetic Retinopathy Treatment</SelectItem>
                          <SelectItem value="Ptosis Repair">Ptosis Repair</SelectItem>
                          <SelectItem value="Chalazion Removal">Chalazion Removal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dr. Sarah Chen">Dr. Sarah Chen</SelectItem>
                            <SelectItem value="Dr. Michael Rodriguez">Dr. Michael Rodriguez</SelectItem>
                            <SelectItem value="Dr. Emily Johnson">Dr. Emily Johnson</SelectItem>
                            <SelectItem value="Dr. David Kim">Dr. David Kim</SelectItem>
                            <SelectItem value="Dr. Lisa Wang">Dr. Lisa Wang</SelectItem>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    name="performedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Procedure Date *</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Duration (minutes)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="60" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description of the procedure..." 
                          className="min-h-[80px]" 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about the procedure..." 
                          className="min-h-[80px]" 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="medical-button-primary"
                disabled={updateProcedureMutation.isPending}
              >
                {updateProcedureMutation.isPending ? "Updating..." : "Update Procedure"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}