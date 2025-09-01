import { useState, useEffect } from "react";
// ...existing code...
import { X, Calendar as CalendarIcon, Clock, User, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
// zod resolver not used for edit modal form
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUpdateAppointment } from '@/services/appointments/use-appointment'
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Patient } from "@shared/schema";
import { useDoctors } from '@/services/doctor'
import { useProcedures } from '@/services/procedures'

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

  // Local form shape for editing (store doctor by id for stability)
  interface FormValues {
    patientId: string;
    doctorId: string;
    appointmentDate: string | Date;
    appointmentTime: string;
    procedure: string;
    status: string;
    notes?: string | null;
  }

  const form = useForm<FormValues>({
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentDate: new Date(),
      appointmentTime: "",
      procedure: "",
      status: "scheduled",
      notes: "",
    },
  });
  // Normalize patients prop: some endpoints return an array, others return { success, data: { patients: [] } }
  const patientOptions = Array.isArray(patients)
    ? patients
    : (patients as any)?.data?.patients ?? (patients as any)?.patients ?? [];
  // Normalize patient objects to a predictable shape
  const normalizedPatients = (patientOptions as any[]).map((p) => ({
    id: String(p.id ?? p.patient_id ?? p.patientId ?? ""),
    firstName: p.firstName ?? p.first_name ?? p.name ?? "",
    lastName: p.lastName ?? p.last_name ?? "",
    email: p.email ?? "",
  }));

  // Fetch doctors for the dropdown
  const { data: doctorsResponse } = useDoctors();
  const doctors = (doctorsResponse as any)?.data?.doctors ?? [];
  const normalizedDoctors = (doctors as any[]).map((d) => ({
    id: String(d.id ?? d.doctorId ?? d.userId ?? ""),
    label: d.displayName ?? d.name ?? d.fullName ?? d.id ?? "",
  }));

  // Fetch procedures for the dropdown
  const { data: proceduresResponse } = useProcedures({ page: 1, limit: 200 });
  const procedures = (proceduresResponse as any)?.data?.procedures ?? [];
  const normalizedProcedures = (procedures as any[]).map((p) => ({
    id: String(p.id ?? p.procedureId ?? p._id ?? ""),
    name: p.procedureName ?? p.procedure_name ?? String(p.id ?? p.procedureId ?? ""),
  }));

  // Ensure form values update when the appointment prop changes
  useEffect(() => {
    if (appointment) {
      // Derive patientId from multiple possible shapes (flat or nested)
      const patientId =
        (appointment as any).patientId ||
        (appointment as any).patient?.id ||
        (appointment as any).patient?.patientId ||
        (appointment as any).patient?.userId ||
        "";

      // Derive doctor id from multiple possible shapes
      let doctorIdRaw =
        (appointment as any).doctorId ||
        (appointment as any).doctor?.id ||
        (appointment as any).doctor?.userId ||
        (appointment as any).doctor?.doctorId ||
        "";

      // If appointment stored doctor by name/label, try to resolve to id
      if (!doctorIdRaw) {
        const doctorLabelRaw = (appointment as any).doctorName || (appointment as any).doctor?.displayName || (appointment as any).doctor?.name || "";
        const matched = normalizedDoctors.find((d) => d.label === doctorLabelRaw || d.id === String(doctorLabelRaw));
        doctorIdRaw = matched ? matched.id : "";
      }

      // Derive procedure: try to resolve to a procedure id from normalizedProcedures
      let procedureRaw = (appointment as any).procedure || "";
      if (!procedureRaw && Array.isArray((appointment as any).procedures) && (appointment as any).procedures.length > 0) {
        const p = (appointment as any).procedures[0];
        procedureRaw = p?.procedureName || p?.procedure_name || p?.id || "";
      }

      let procedureId = "";
      if (procedureRaw) {
        const matchedProc = normalizedProcedures.find(
          (pr) => pr.id === String(procedureRaw) || pr.name === procedureRaw
        );
        procedureId = matchedProc ? matchedProc.id : String(procedureRaw);
      }

      const appointmentDate = (appointment as any).appointmentDate ? new Date((appointment as any).appointmentDate) : new Date();
      const appointmentTime = (appointment as any).appointmentTime || "";
      const status = (appointment as any).status || "scheduled";
      const notes = (appointment as any).notes || "";

      form.reset({
        patientId,
        doctorId: doctorIdRaw,
        appointmentDate,
        appointmentTime,
  procedure: procedureId,
        status,
        notes,
      });
    }
  }, [appointment, form, normalizedDoctors, normalizedProcedures]);

  const updateAppointmentMutation = useUpdateAppointment();

  const onSubmit = (data: FormValues) => {
    // Transform into the payload shape expected by the API
    const appointmentDateIso = data.appointmentDate instanceof Date ? data.appointmentDate.toISOString() : String(data.appointmentDate);

  const procName = normalizedProcedures.find(p => p.id === data.procedure)?.name ?? data.procedure;

  const payload: any = {
      patient: { id: data.patientId },
      doctor: { id: data.doctorId },
      appointmentDate: appointmentDateIso,
      appointmentTime: data.appointmentTime,
      duration: 30,
      appointmentType: 'consultation',
      reason: null,
      notes: data.notes || null,
      status: data.status,
      procedures: [
        {
          id: data.procedure,
          procedureName: procName,
          performedDate: appointmentDateIso,
          status: 'planned',
        },
      ],
    };

    if (!appointment?.id) {
      toast({
        title: 'Missing Appointment ID',
        description: 'Cannot update appointment without a valid id.',
        variant: 'destructive',
      })
      return
    }

    updateAppointmentMutation.mutate({ appointmentId: String(appointment.id), data: payload }, {
      onSuccess: () => onClose(),
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!appointment) return null;

  // ...existing code...


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
                      <Select value={field.value as string} onValueChange={field.onChange}>
                        <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {normalizedPatients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {`${patient.firstName}${patient.lastName ? ` ${patient.lastName}` : ''}${patient.email ? ` - ${patient.email}` : ''}`}
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
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor *</FormLabel>
                        <Select value={field.value as string} onValueChange={field.onChange}>
                          <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select doctor" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {normalizedDoctors.length === 0 ? (
                              <SelectItem value="">No doctors available</SelectItem>
                            ) : (
                              normalizedDoctors.map((doc) => (
                                  <SelectItem key={doc.id} value={doc.id}>
                                    {doc.label}
                                  </SelectItem>
                                ))
                            )}
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
                        <Select value={field.value as string} onValueChange={field.onChange}>
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
                      <Select value={field.value as string} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select procedure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {normalizedProcedures.length === 0 ? (
                            <SelectItem value="">No procedures available</SelectItem>
                          ) : (
                            normalizedProcedures.map((proc) => (
                              <SelectItem key={proc.id} value={proc.id}>
                                {proc.name}
                              </SelectItem>
                            ))
                          )}
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