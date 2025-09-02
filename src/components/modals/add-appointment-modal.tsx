// react-query is not required directly in this modal now
import { Calendar as CalendarIcon, Clock, User, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
// zodResolver removed because modal uses a local form type to match payload
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAddAppointment } from '@/services/appointments'
import { /* insertAppointmentSchema, */ type Patient } from "@shared/schema";

import { useDoctors } from '@/services/doctor'
import { usePatients } from '@/services/use-patient/use-patient'
import { useProcedures } from '@/services/procedures'

interface AddAppointmentModalProps {
  patients: Patient[];
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

export default function AddAppointmentModal({
  patients,
  isOpen,
  onClose,
  selectedDate,
}: AddAppointmentModalProps) {
  // local form shape for this modal (we need doctorId & procedure id)
  interface ModalFormValues {
    patientId: string
    doctorId: string
    appointmentDate: string | Date
    appointmentTime: string
    procedure: string
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'urgent'
    notes?: string | null
  }

  const form = useForm<ModalFormValues>({
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentDate: selectedDate || new Date(),
      appointmentTime: "",
      procedure: "",
      status: "scheduled",
      notes: "",
    },
  });

  // Fetch doctors for the dropdown
  const { data: doctorsResponse, isLoading: doctorsLoading } = useDoctors()
  const doctors = doctorsResponse?.data?.doctors ?? []

  // Also fetch patients here so the modal shows the latest list (fallback to prop)
  const { data: patientsResponse, isLoading: patientsLoading } = usePatients({ page: 1, limit: 100, status: 'all' })
  const fetchedPatients = patientsResponse?.data?.patients ?? []
  const patientOptions = fetchedPatients.length > 0 ? fetchedPatients : patients

  // Fetch procedures for the procedure dropdown
  const { data: proceduresResponse, isLoading: proceduresLoading } = useProcedures({ page: 1, limit: 100 })
  const fetchedProcedures = proceduresResponse?.data?.procedures ?? []

  // use the centralized appointment hook which calls the Supabase Edge Function
  const addAppointmentMutation = useAddAppointment()

  const onSubmit = (data: ModalFormValues) => {
    // Transform form data into the payload expected by the edge function
    // Find selected doctor (we store id in the select) and selected procedure
    const selectedDoctorId = data.doctorId
    const selectedProcedureValue = data.procedure

    const foundProcedure = fetchedProcedures.find((p: any) => p.id === selectedProcedureValue || p.procedureName === selectedProcedureValue || (p as any).procedure_name === selectedProcedureValue)
    const procedureName = (foundProcedure as any)?.procedureName ?? (foundProcedure as any)?.procedure_name ?? String(selectedProcedureValue)

    const appointmentDateIso = data.appointmentDate instanceof Date ? data.appointmentDate.toISOString() : String(data.appointmentDate)

    const payload = {
      patient: { id: data.patientId },
      doctor: { id: selectedDoctorId },
      appointmentDate: appointmentDateIso,
      appointmentTime: data.appointmentTime,
      duration: 30,
      appointmentType: 'consultation',
      reason: null,
      notes: data.notes || null,
      status: data.status,
      procedures: [
        {
          id: selectedProcedureValue,
          procedureName: procedureName,
          performedDate: appointmentDateIso,
          status: 'planned',
        },
      ],
    }

    addAppointmentMutation.mutate(payload, {
      onSuccess: () => {
        handleClose()
      },
    })
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <Stethoscope className="h-5 w-5 text-medical-blue" />
            <span>Schedule New Appointment</span>
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
                          <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patientsLoading ? (
                            <SelectItem value="__loading-patients" disabled>Loading patients...</SelectItem>
                          ) : (patientOptions?.length ?? 0) === 0 ? (
                            <SelectItem value="__no-patients" disabled>No patients available</SelectItem>
                          ) : (
                            patientOptions.map((patient: any) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstName && patient.lastName
                                  ? `${patient.firstName} ${patient.lastName} - ${patient.email ?? ''}`
                                  : `${patient.name ?? `${patient.email ?? 'Unknown'}`} ${patient.email ? `- ${patient.email}` : ''}`}
                              </SelectItem>
                            ))
                          )}
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
                            className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring"
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
                          <Input type="time" {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctorsLoading ? (
                              <SelectItem value="" disabled>Loading doctors...</SelectItem>
                            ) : doctors.length === 0 ? (
                              <SelectItem value="" disabled>No doctors available</SelectItem>
                            ) : (
                              doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.displayName ?? doctor.name}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
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
                          <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                            <SelectValue placeholder="Select procedure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proceduresLoading ? (
                            <SelectItem value="__loading-procedures" disabled>Loading procedures...</SelectItem>
                          ) : fetchedProcedures.length === 0 ? (
                            <SelectItem value="__no-procedures" disabled>No procedures available</SelectItem>
                          ) : (
                            fetchedProcedures.map((proc: any) => (
                              <SelectItem key={proc.id} value={proc.id}>
                                {proc.procedureName ?? proc.procedure_name ?? `Procedure ${proc.id}`}
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
                          className="min-h-[80px] border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" 
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
                disabled={addAppointmentMutation.isPending}
              >
                {addAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}