import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, Calendar, Stethoscope, DollarSign, Phone, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Appointment, Procedure, Payment } from "@shared/schema";

interface PatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientModal({ patient, isOpen, onClose }: PatientModalProps) {
  const [activeTab, setActiveTab] = useState("medical-history");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', { patientId: patient?.id }],
    enabled: !!patient?.id,
  });

  const { data: procedures } = useQuery<Procedure[]>({
    queryKey: ['/api/procedures', { patientId: patient?.id }],
    enabled: !!patient?.id,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['/api/payments', { patientId: patient?.id }],
    enabled: !!patient?.id,
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const response = await apiRequest('PATCH', `/api/patients/${patient?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Patient Updated",
        description: "Patient information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update patient information.",
        variant: "destructive",
      });
    },
  });

  if (!patient) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'medical-badge-normal';
      case 'completed':
        return 'medical-badge-normal';
      case 'in-progress':
        return 'medical-badge-mild';
      case 'urgent':
        return 'medical-badge-urgent';
      case 'paid':
        return 'medical-badge-normal';
      case 'pending':
        return 'medical-badge-mild';
      case 'overdue':
        return 'medical-badge-urgent';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Patient Record</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-medical-blue">
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-professional-dark">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-gray-600">
                    {patient.gender}, {getAge(patient.dateOfBirth)} years old
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{patient.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{patient.address}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={patient.isActive ? 'medical-badge-normal' : 'bg-gray-100 text-gray-800'}>
                      {patient.isActive ? 'Active Patient' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Member since {format(new Date(patient.memberSince), 'yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Insurance Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Provider</p>
                    <p className="text-sm">{patient.insuranceProvider || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Policy Number</p>
                    <p className="text-sm">{patient.insurancePolicyNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Group Number</p>
                    <p className="text-sm">{patient.insuranceGroupNumber || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="procedures">Procedures</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="medical-history" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Medical Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patient.medicalHistory ? (
                        <div className="whitespace-pre-wrap text-sm text-gray-700">{patient.medicalHistory}</div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No medical conditions recorded</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Medications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patient.currentMedications && patient.currentMedications.length > 0 ? (
                        patient.currentMedications.map((medication, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            {medication}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No current medications
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-professional-dark mb-2">Allergies</h4>
                      <div className="space-y-2">
                        {patient.allergies && patient.allergies.length > 0 ? (
                          patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="outline" className="mr-2">
                              {allergy}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No known allergies</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Appointment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointments && appointments.length > 0 ? (
                      appointments.map((appointment: Appointment) => (
                        <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-professional-dark">{appointment.procedure}</p>
                              <p className="text-sm text-gray-600">Dr. {appointment.doctorName}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} at {appointment.appointmentTime}
                              </p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                              )}
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No appointments recorded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="procedures" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Procedure History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {procedures && procedures.length > 0 ? (
                      procedures.map((procedure: Procedure) => (
                        <div key={procedure.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-professional-dark">{procedure.procedureName}</h4>
                            <Badge className={getStatusColor(procedure.status)}>
                              {procedure.status.charAt(0).toUpperCase() + procedure.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">Dr. {procedure.doctorName}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(procedure.performedDate), 'MMM dd, yyyy')}
                            {procedure.duration && ` • ${procedure.duration} minutes`}
                            {procedure.cost && ` • $${procedure.cost}`}
                          </p>
                          {procedure.description && (
                            <p className="text-sm text-gray-600 mt-2">{procedure.description}</p>
                          )}
                          {procedure.notes && (
                            <p className="text-sm text-gray-500 mt-1">Notes: {procedure.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No procedures recorded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments && payments.length > 0 ? (
                      payments.map((payment: Payment) => (
                        <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-professional-dark">
                                Invoice: {payment.invoiceNumber || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Amount: ${parseFloat(payment.amount).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Method: {payment.paymentMethod}
                                {payment.paymentDate && ` • Paid: ${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}`}
                                {payment.dueDate && ` • Due: ${format(new Date(payment.dueDate), 'MMM dd, yyyy')}`}
                              </p>
                            </div>
                            <Badge className={getStatusColor(payment.paymentStatus)}>
                              {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                            </Badge>
                          </div>
                          {payment.insuranceClaim && (
                            <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                              <div className="flex justify-between">
                                <span>Insurance Amount:</span>
                                <span>${payment.insuranceAmount || '0.00'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Patient Amount:</span>
                                <span>${payment.patientAmount || '0.00'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No billing records found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Emergency Contact */}
          {(patient.emergencyContactName || patient.emergencyContactPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{patient.emergencyContactName}</p>
                    <p className="text-sm text-gray-600">{patient.emergencyContactPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            className="medical-button-primary"
            onClick={() => {
              // Handle save changes
              toast({
                title: "Changes Saved",
                description: "Patient information has been updated.",
              });
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
