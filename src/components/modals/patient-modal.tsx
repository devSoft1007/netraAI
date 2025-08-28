import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, User, Calendar, Stethoscope, DollarSign, Phone, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useUpdatePatient } from '@/services/use-patient';
import type { Patient, Appointment, Procedure, Payment } from "@shared/schema";

interface PatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientModal({ patient, isOpen, onClose }: PatientModalProps) {
  const [activeTab, setActiveTab] = useState("medical-history");
  // toasts are handled by the service hook; no local toast needed here

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

  const updatePatientMutation = useUpdatePatient();

  // Local editable state derived from the patient prop
  const [editedPatient, setEditedPatient] = useState<Partial<Patient> & Record<string, any>>(() => ({ ...patient }));

  useEffect(() => {
    setEditedPatient({ ...patient });
  }, [patient]);

  if (!patient) return null;

  // Safely convert possible string/Date/undefined values to a valid Date or null
  const toSafeDate = (value: any): Date | null => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const getAge = (dateOfBirth: any): string | number => {
    const birthDate = toSafeDate(dateOfBirth);
    if (!birthDate) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Normalize patient object for shallow comparison (dates -> ISO strings, arrays as JSON)
  const normalizeForCompare = (p: Partial<Patient> | null) => {
    if (!p) return null;
    return {
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      gender: p.gender || '',
      dateOfBirth: toSafeDate(p.dateOfBirth)?.toISOString() || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      insuranceProvider: p.insuranceProvider || '',
      insurancePolicyNumber: p.insurancePolicyNumber || '',
      insuranceGroupNumber: p.insuranceGroupNumber || '',
      medicalHistory: p.medicalHistory || '',
      currentMedications: Array.isArray(p.currentMedications) ? p.currentMedications : (p.currentMedications ? [p.currentMedications as any] : []),
      allergies: Array.isArray(p.allergies) ? p.allergies : (p.allergies ? [p.allergies as any] : []),
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      isActive: !!p.isActive,
    };
  };

  const isDirty = JSON.stringify(normalizeForCompare(patient)) !== JSON.stringify(normalizeForCompare(editedPatient));

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
                    {getInitials(editedPatient.firstName || '', editedPatient.lastName || '')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={editedPatient.firstName ?? ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full"
                      placeholder="First name"
                    />
                    <Input
                      value={editedPatient.lastName ?? ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full"
                      placeholder="Last name"
                    />
                  </div>

                  <p className="text-gray-600 mt-2">
                    <div className="w-40 inline-block align-middle mr-3">
                      <Select value={editedPatient.gender ?? ''} onValueChange={(v) => setEditedPatient(prev => ({ ...prev, gender: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {getAge(editedPatient.dateOfBirth ?? patient.dateOfBirth)} years old
                  </p>

                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <Input
                        value={editedPatient.email ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, email: e.target.value }))}
                        className="w-56"
                        placeholder="Email"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <Input
                        value={editedPatient.phone ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-40"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <Input
                      value={editedPatient.address ?? ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full"
                      placeholder="Address"
                    />
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={(editedPatient.isActive ?? patient.isActive) ? 'medical-badge-normal' : 'bg-gray-100 text-gray-800'}>
                      {(editedPatient.isActive ?? patient.isActive) ? 'Active Patient' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-gray-500">Active</Label>
                      <Switch
                        checked={!!(editedPatient.isActive ?? patient.isActive)}
                        onCheckedChange={(val) => setEditedPatient(prev => ({ ...prev, isActive: !!val }))}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      Member since {(() => {
                        const ms = toSafeDate(editedPatient.memberSince ?? patient.memberSince);
                        return ms ? format(ms, 'yyyy') : 'N/A';
                      })()}
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
                      <Input
                        value={editedPatient.insuranceProvider ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                        className="w-full p-1 rounded border text-sm"
                        placeholder="Insurance provider"
                      />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Policy Number</p>
                      <Input
                        value={editedPatient.insurancePolicyNumber ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                        className="w-full p-1 rounded border text-sm"
                        placeholder="Policy number"
                      />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Group Number</p>
                      <Input
                        value={editedPatient.insuranceGroupNumber ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, insuranceGroupNumber: e.target.value }))}
                        className="w-full p-1 rounded border text-sm"
                        placeholder="Group number"
                      />
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
                      <Textarea
                        value={editedPatient.medicalHistory ?? ''}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, medicalHistory: e.target.value }))}
                        className="min-h-[120px] text-sm"
                        placeholder="Medical history"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Medications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Textarea
                        value={(editedPatient.currentMedications && Array.isArray(editedPatient.currentMedications)) ? (editedPatient.currentMedications as string[]).join('\n') : (typeof editedPatient.currentMedications === 'string' ? editedPatient.currentMedications : '')}
                        onChange={(e) => setEditedPatient(prev => ({ ...prev, currentMedications: e.target.value.split('\n').filter(Boolean) }))}
                        className="min-h-[80px] text-sm"
                        placeholder="One medication per line"
                      />
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-professional-dark mb-2">Allergies</h4>
                      <div className="space-y-2">
                        {((editedPatient.allergies && (editedPatient.allergies as string[]).length > 0) || false) ? (
                          (editedPatient.allergies as string[]).map((allergy, index) => (
                            <Badge key={index} variant="outline" className="mr-2">
                              {allergy}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No known allergies</p>
                        )}
                        <div className="mt-2">
                          <Textarea
                            value={editedPatient.allergies && Array.isArray(editedPatient.allergies) ? (editedPatient.allergies as string[]).join('\n') : ''}
                            onChange={(e) => setEditedPatient(prev => ({ ...prev, allergies: e.target.value.split('\n').filter(Boolean) }))}
                            className="min-h-[60px] text-sm"
                            placeholder="One allergy per line"
                          />
                        </div>
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
                                {(() => {
                                  const ad = toSafeDate(appointment.appointmentDate);
                                  return `${ad ? format(ad, 'MMM dd, yyyy') : 'Unknown date'}${appointment.appointmentTime ? ` at ${appointment.appointmentTime}` : ''}`;
                                })()}
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
                            {(() => {
                              const pd = toSafeDate(procedure.performedDate);
                              return pd ? format(pd, 'MMM dd, yyyy') : 'Unknown date';
                            })()}
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
                                Amount: ${Number(payment.amount).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Method: {payment.paymentMethod}
                                {payment.paymentDate && (() => {
                                  const pdate = toSafeDate(payment.paymentDate);
                                  return pdate ? ` • Paid: ${format(pdate, 'MMM dd, yyyy')}` : '';
                                })()}
                                {payment.dueDate && (() => {
                                  const ddate = toSafeDate(payment.dueDate);
                                  return ddate ? ` • Due: ${format(ddate, 'MMM dd, yyyy')}` : '';
                                })()}
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
                  <div className="w-full">
                    <Input
                      value={editedPatient.emergencyContactName ?? ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full p-1 rounded border text-sm mb-1"
                      placeholder="Contact name"
                    />
                    <Input
                      value={editedPatient.emergencyContactPhone ?? ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full p-1 rounded border text-sm"
                      placeholder="Contact phone"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-6 border-t">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Date of birth</div>
                    <Input
                      type="date"
                      value={toSafeDate(editedPatient.dateOfBirth ?? patient.dateOfBirth) ? format(toSafeDate(editedPatient.dateOfBirth ?? patient.dateOfBirth) as Date, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="p-1"
                    />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="medical-button-primary"
              onClick={() => {
                // Call mutation with only changed fields
                const payload: Partial<Patient> & { id?: string } = { id: patient.id };
                const normalizedOrig = normalizeForCompare(patient) as any;
                const normalizedEdit = normalizeForCompare(editedPatient) as any;
                Object.keys(normalizedEdit).forEach((key) => {
                  if (normalizedEdit[key] !== normalizedOrig[key]) {
                    // Map back a few fields
                    if (key === 'currentMedications' || key === 'allergies') {
                      (payload as any)[key] = editedPatient[key];
                    } else if (key === 'dateOfBirth') {
                      // Ensure dateOfBirth is a YYYY-MM-DD string or null
                      const dob = editedPatient.dateOfBirth ?? patient.dateOfBirth;
                      if (!dob) {
                        (payload as any)[key] = null;
                      } else if (typeof dob === 'string') {
                        (payload as any)[key] = dob;
                      } else {
                        (payload as any)[key] = new Date(dob).toISOString().split('T')[0];
                      }
                    } else {
                      (payload as any)[key] = (editedPatient as any)[key];
                    }
                  }
                });

                // Use service hook which will map id -> patientId and call the edge function
                updatePatientMutation.mutate(payload as any);
              }}
              disabled={!isDirty || updatePatientMutation.status === 'pending'}
            >
              {updatePatientMutation.status === 'pending' ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
