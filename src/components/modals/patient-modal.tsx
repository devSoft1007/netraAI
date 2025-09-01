import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePatientById, useUpdatePatient } from '@/services/use-patient/use-patient'
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Patient, Appointment, Procedure, Payment } from "@shared/schema";
import PatientBasicInfo from './patient-basic-info'
import InsuranceInfoCard from './insurance-info-card'
import PatientTabs from './patient-tabs'
import EmergencyContactCard from './emergency-contact-card'

interface PatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientModal({ patient, isOpen, onClose }: PatientModalProps) {
  const [activeTab, setActiveTab] = useState("medical-history");
  // toasts are handled by the service hook; no local toast needed here

  // const { data: appointments } = useQuery<Appointment[]>({
  //   queryKey: ['/api/appointments', { patientId: patient?.id }],
  //   enabled: !!patient?.id,
  // });

  const appointments: any = []

  const { data: procedures } = useQuery<Procedure[]>({
    queryKey: ['/api/procedures', { patientId: patient?.id }],
    enabled: !!patient?.id,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['/api/payments', { patientId: patient?.id }],
    enabled: !!patient?.id,
  });

  const updatePatientMutation = useUpdatePatient();

  // Fetch the full patient payload from the Edge Function and pre-populate modal fields
  const { data: patientByIdData } = usePatientById(patient?.id)

  // Local editable state derived from the patient prop
  const [editedPatient, setEditedPatient] = useState<Partial<Patient> & Record<string, any>>(() => ({ ...patient }));

  useEffect(() => {
    setEditedPatient({ ...patient });
  }, [patient]);

  // When the edge function returns the formatted patient, map it into the editor state.
  useEffect(() => {
    if (!patientByIdData?.patient || !isOpen) return

    const p: any = patientByIdData.patient

    // Split name into first/last
    const nameParts = (p.name || '').trim().split(/\s+/)
    const firstName = nameParts.shift() || ''
    const lastName = nameParts.join(' ') || ''

    const emergency = p.emergencyContact || p.emergency_contact || {}

    setEditedPatient(prev => ({
      ...prev,
      firstName,
      lastName,
      dateOfBirth: p.dateOfBirth ?? p.dateOfBirth ?? prev.dateOfBirth,
      email: p.email ?? prev.email,
      phone: p.phone ?? prev.phone,
      address: p.address ?? prev.address,
      insuranceProvider: p.insurance ?? prev.insuranceProvider ?? '',
      insurancePolicyNumber: prev.insurancePolicyNumber ?? '',
      insuranceGroupNumber: prev.insuranceGroupNumber ?? '',
      medicalHistory: p.medicalHistory ?? prev.medicalHistory,
      currentMedications: p.currentMedications ?? prev.currentMedications ?? [],
      allergies: p.allergies ?? prev.allergies ?? [],
      emergencyContactName: emergency?.name || emergency?.fullName || emergency?.contactName || prev.emergencyContactName || '',
      emergencyContactPhone: emergency?.phone || emergency?.contactPhone || prev.emergencyContactPhone || '',
      isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.status === 'Active' || prev.isActive),
      memberSince: p.memberSince ?? prev.memberSince,
    }))
  }, [patientByIdData, isOpen])

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PatientBasicInfo
              patient={patient}
              editedPatient={editedPatient}
              setEditedPatient={setEditedPatient}
              getInitials={getInitials}
              getAge={getAge}
              toSafeDate={toSafeDate}
            />

            <div>
              <InsuranceInfoCard editedPatient={editedPatient} setEditedPatient={setEditedPatient} />
            </div>
          </div>

          {/* Medical history + meds + allergies remain here to keep prop passing minimal */}
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

          <PatientTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            appointments={appointments}
            procedures={procedures}
            payments={payments}
            getStatusColor={getStatusColor}
            toSafeDate={toSafeDate}
          />

          <EmergencyContactCard patient={patient} editedPatient={editedPatient} setEditedPatient={setEditedPatient} />
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
