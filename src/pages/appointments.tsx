import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Plus, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppointmentCalendar from "@/components/calendar/appointment-calendar";
import EditAppointmentModal from "@/components/modals/edit-appointment-modal";
import AddAppointmentModal from "@/components/modals/add-appointment-modal";
import { useAppointmentQuery } from "@/services/appointments";
import { usePatients } from "@/services/use-patient/use-patient";
import type { Appointment, Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range for fetching appointments (default to current month)
  const currentDate = new Date();
  const startDate = startOfMonth(currentDate).toISOString();
  const endDate = endOfMonth(currentDate).toISOString();

  // Fetch appointments using the new hook
  const { data: appointments = [], isLoading, error } = useAppointmentQuery({
    start: startDate,
    end: endDate
  });

  // Use the dedicated patients hook which calls the Edge Function and returns a wrapped response
  const { data: patientsResponse } = usePatients({ page: 1, limit: 200 });
  const patients = (patientsResponse as any)?.data?.patients ?? (patientsResponse as any)?.patients ?? [];

  // const deleteAppointmentMutation = useMutation({
  //   mutationFn: async (appointmentId: string) => {
  //     const response = await apiRequest('DELETE', `/api/appointments/${appointmentId}`);
  //     return response.json();
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
  //     toast({
  //       title: "Appointment Deleted",
  //       description: "The appointment has been deleted successfully.",
  //     });
  //   },
  //   onError: () => {
  //     toast({
  //       title: "Delete Failed",
  //       description: "Failed to delete the appointment. Please try again.",
  //       variant: "destructive",
  //     });
  //   },
  // });

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      // deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // TODO: Implement new appointment creation
    toast({
      title: "Create New Appointment",
      description: `Selected time slot: ${format(slotInfo.start, "MMM dd, yyyy 'at' h:mm a")}`,
    });
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading appointments...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500">Error loading appointments: {error.message}</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-professional-dark">Appointment Management</h1>
          <p className="text-gray-600 mt-1">Schedule and manage patient appointments with calendar view</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0 medical-button-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <AppointmentCalendar
        appointments={appointments}
        onEditAppointment={handleEditAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onSelectSlot={handleSelectSlot}
      />

      <AddAppointmentModal
  patients={patients || []}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditAppointmentModal
        appointment={selectedAppointment}
  patients={patients || []}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
    </main>
  );
}
