import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, Patient } from "@shared/schema";

export default function TodaysSchedule() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const appointments: any = []; // Replace with actual fetched appointments
  const isLoading = false; // Replace with actual loading state
  // const { data: appointments, isLoading } = useQuery<Appointment[]>({
  //   queryKey: ['/api/appointments', { date: today }],
  // });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: Patient) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'medical-badge-normal';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'medical-badge-urgent';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'urgent':
        return 'Urgent';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  };

  if (isLoading) {
    return (
      <div className="medical-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-professional-dark">Today's Schedule</h3>
          <button className="text-medical-blue hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-professional-dark">Today's Schedule</h3>
        <button className="text-medical-blue hover:text-blue-700 text-sm font-medium">View All</button>
      </div>
      
      <div className="space-y-4">
        {appointments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for today
          </div>
        ) : (
          appointments?.map((appointment: Appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-12 bg-medical-blue rounded-full"></div>
                <div>
                  <p className="font-medium text-professional-dark">
                    {getPatientName(appointment.patientId)}
                  </p>
                  <p className="text-sm text-gray-600">{appointment.procedure}</p>
                  <p className="text-sm text-gray-500">Dr. {appointment.doctorName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-professional-dark">{appointment.appointmentTime}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
