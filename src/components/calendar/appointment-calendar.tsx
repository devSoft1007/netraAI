import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useDeleteAppointment } from '@/services/appointments/use-appointment';
import FloatingPopup from "@/components/ui/floating-popup";
import type { Appointment } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

// date-fns localizer setup
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onEditAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export default function AppointmentCalendar({
  appointments,
  onEditAppointment,
  onDeleteAppointment,
  onSelectSlot,
}: AppointmentCalendarProps) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Status to color mapping based on getStatusColor function
  const statusColors = {
    "confirmed": "bg-green-500",
    "scheduled": "bg-blue-500",
    "in-progress": "bg-yellow-500",
    "completed": "bg-gray-500",
    "cancelled": "bg-red-500",
    "urgent": "bg-orange-500",
  };

  const statusLabels = {
    "confirmed": "Confirmed",
    "scheduled": "Scheduled",
    "in-progress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "urgent": "Urgent",
  };

  // Use patient name from the appointment data
  const getPatientName = (appointment: Appointment) => {
    const a: any = appointment as any;
    return (
      a.patientName ||
      a.patient?.name ||
      [a.patient?.firstName, a.patient?.lastName].filter(Boolean).join(' ') ||
      'Unknown Patient'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    if (!appointments) return [];

    return appointments.map((appointment) => {
      const appointmentDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.appointmentTime.split(":").map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on duration if available, otherwise default to 1 hour
      const endTime = new Date(appointmentDateTime);
      const duration = (appointment as any).duration;
      if (duration) {
        endTime.setMinutes(endTime.getMinutes() + duration);
      } else {
        endTime.setHours(endTime.getHours() + 1);
      }

      return {
        id: appointment.id,
        title: `${getPatientName(appointment)} - ${appointment.procedure}`,
        start: appointmentDateTime,
        end: endTime,
        resource: appointment,
      };
    });
  }, [appointments]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "#3174ad";
    let borderColor = "#265a87";

    switch (status) {
      case "confirmed":
        backgroundColor = "#22c55e";
        borderColor = "#16a34a";
        break;
      case "scheduled":
        backgroundColor = "#3b82f6";
        borderColor = "#2563eb";
        break;
      case "in-progress":
        backgroundColor = "#f59e0b";
        borderColor = "#d97706";
        break;
      case "completed":
        backgroundColor = "#6b7280";
        borderColor = "#4b5563";
        break;
      case "cancelled":
        backgroundColor = "#ef4444";
        borderColor = "#dc2626";
        break;
      case "urgent":
        backgroundColor = "#f97316";
        borderColor = "#ea580c";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        color: "white",
        fontSize: "12px",
        padding: "2px 4px",
      },
    };
  };

  const deleteAppointment = useDeleteAppointment();

  const handleDeleteAppointment = (id: string | number) => {
    // If parent provided a handler, call it as well (backwards compatibility)
    onDeleteAppointment?.(String(id));
    deleteAppointment.mutate(String(id));
  };

  const AppointmentPopupContent = ({ appointment }: { appointment: Appointment }) => (
    <div className="space-y-3 min-w-[280px]">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-medical-blue">{appointment.procedure}</h4>
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>{getPatientName(appointment)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          <span>{format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{appointment.appointmentTime}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>Dr. {appointment.doctorName}</span>
        </div>
        
        {appointment.notes && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <strong>Notes:</strong> {appointment.notes}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onEditAppointment?.(appointment)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={() => handleDeleteAppointment(appointment.id)}
          disabled={deleteAppointment.isPending}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {deleteAppointment.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <FloatingPopup
      content={<AppointmentPopupContent appointment={event.resource} />}
      trigger="hover"
      placement="top"
      className="bg-white shadow-xl border-0"
    >
      <div className="h-full w-full cursor-pointer">
        <div className="text-xs font-medium truncate">
          {getPatientName(event.resource)}
        </div>
        <div className="text-xs opacity-90 truncate">
          {event.resource.procedure}
        </div>
      </div>
    </FloatingPopup>
  );

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  // Helper function to navigate dates based on current view
  const getNavigationDate = (direction: 'prev' | 'next') => {
    switch (currentView) {
      case Views.MONTH:
        return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
      case Views.WEEK:
        return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
      case Views.DAY:
        return direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
      default:
        return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    }
  };

  const customToolbar = () => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate(getNavigationDate('prev'))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate(new Date())}
        >
          Today
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate(getNavigationDate('next'))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <span className="font-semibold text-lg text-professional-dark ml-4">
          {format(currentDate, 
            currentView === Views.MONTH ? "MMMM yyyy" : 
            currentView === Views.WEEK ? "MMM dd, yyyy" : 
            "MMMM dd, yyyy"
          )}
        </span>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant={currentView === Views.MONTH ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange(Views.MONTH)}
          className={currentView === Views.MONTH ? "medical-button-primary" : ""}
        >
          Month
        </Button>
        <Button
          variant={currentView === Views.WEEK ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange(Views.WEEK)}
          className={currentView === Views.WEEK ? "medical-button-primary" : ""}
        >
          Week
        </Button>
        <Button
          variant={currentView === Views.DAY ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange(Views.DAY)}
          className={currentView === Views.DAY ? "medical-button-primary" : ""}
        >
          Day
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-professional-dark">Appointment Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {customToolbar()}
        
        <div className="calendar-container" style={{ height: "600px", padding: "0 1rem 1rem" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
              toolbar: () => null, // We use our custom toolbar
            }}
            onSelectSlot={onSelectSlot}
            selectable
            popup
            showMultiDayTimes
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 8, 0, 0)} // 8 AM
            max={new Date(2024, 0, 1, 18, 0, 0)} // 6 PM
            formats={{
              timeGutterFormat: "h:mm a",
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
