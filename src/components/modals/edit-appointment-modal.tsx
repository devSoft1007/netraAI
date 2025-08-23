import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon, Clock, User, Stethoscope } from "lucide-react";
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
import { insertAppointmentSchema, type Appointment, type InsertAppointment, type Patient } from "@shared/schema";
import { format } from "date-fns";

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  patients: Patient[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAppointmentModal({
  appointment,
  patients,
  isOpen,
  onClose,
}: EditAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      patientId: appointment?.patientId || "",
      doctorName: appointment?.doctorName || "",
      appointmentDate: appointment ? new Date(appointment.appointmentDate) : new Date(),
      appointmentTime: appointment?.appointmentTime || "",
      procedure: appointment?.procedure || "",
      status: appointment?.status || "scheduled",
      notes: appointment?.notes || "",
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const response = await apiRequest('PATCH', `/api/appointments/${appointment?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment Updated",
        description: "The appointment has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAppointment) => {
    updateAppointmentMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!appointment) return null;

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <Stethoscope className="h-5 w-5 text-medical-blue" />
            <span>Edit Appointment</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-medical-blue">Appointment Details</CardTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Date *</span>
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
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Time *</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="procedure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select procedure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Regular Checkup">Regular Checkup</SelectItem>
                          <SelectItem value="Eye Exam">Eye Exam</SelectItem>
                          <SelectItem value="Retinal Screening">Retinal Screening</SelectItem>
                          <SelectItem value="Glaucoma Test">Glaucoma Test</SelectItem>
                          <SelectItem value="Cataract Surgery">Cataract Surgery</SelectItem>
                          <SelectItem value="LASIK Consultation">LASIK Consultation</SelectItem>
                          <SelectItem value="Contact Lens Fitting">Contact Lens Fitting</SelectItem>
                          <SelectItem value="Diabetic Eye Exam">Diabetic Eye Exam</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or special instructions..." 
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
                disabled={updateAppointmentMutation.isPending}
              >
                {updateAppointmentMutation.isPending ? "Updating..." : "Update Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}