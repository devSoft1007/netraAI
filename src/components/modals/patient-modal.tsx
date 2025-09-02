import { useEffect } from "react";
import { usePatientById, useUpdatePatient } from '@/services/use-patient/use-patient'
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPatientSchema, type InsertPatient } from "@shared/schema";
import type { Patient } from "@shared/schema";

interface PatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientModal({ patient, isOpen, onClose }: PatientModalProps) {
  const updatePatientMutation = useUpdatePatient();
  
  // Fetch the full patient payload from the Edge Function
  const { data: patientByIdData } = usePatientById(patient?.id)

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: new Date(),
      gender: "",
      address: "",
      emergencyContactName: undefined,
      emergencyContactPhone: undefined,
      insuranceProvider: undefined,
      medicalHistory: undefined,
    },
  });

  // When the edge function returns the formatted patient, pre-populate the form
  useEffect(() => {
    if (!patientByIdData?.patient || !isOpen) return

    const p: any = patientByIdData.patient

    // Split name into first/last
    const nameParts = (p.name || '').trim().split(/\s+/)
    const firstName = nameParts.shift() || ''
    const lastName = nameParts.join(' ') || ''

    const emergency = p.emergencyContact || p.emergency_contact || {}

    form.reset({
      firstName,
      lastName,
      email: p.email ?? '',
      phone: p.phone ?? '',
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : new Date(),
      gender: p.gender ?? '',
      address: p.address ?? '',
      emergencyContactName: emergency?.name || emergency?.fullName || emergency?.contactName || '',
      emergencyContactPhone: emergency?.phone || emergency?.contactPhone || '',
      insuranceProvider: p.insurance ?? '',
      medicalHistory: p.medicalHistory ?? '',
    })
  }, [patientByIdData, isOpen, form])

  const onSubmit = (data: InsertPatient) => {
    // Build payload but avoid sending nulls: use undefined for empty optional strings.
    const payload = {
      id: patient?.id,
      ...data,
      emergencyContactName: data.emergencyContactName ? data.emergencyContactName : undefined,
      emergencyContactPhone: data.emergencyContactPhone ? data.emergencyContactPhone : undefined,
      insuranceProvider: data.insuranceProvider ? data.insuranceProvider : undefined,
      // medicalHistory is a free-form string (textarea); keep as-is or undefined
      medicalHistory: typeof data.medicalHistory === 'string' && data.medicalHistory.trim().length > 0 ? data.medicalHistory : undefined,
    } as any;

    // Call the edge function with the patient data
    updatePatientMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold text-professional-dark">
            <User className="h-5 w-5 text-medical-blue" />
            <span>Edit Patient</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-medical-blue">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>Email Address *</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="patient@example.com" {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>Phone Number *</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Date of Birth *</span>
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border border-gray-300 focus:ring-2 focus:ring-ring">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter full address" className="min-h-[80px] border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-healthcare-green">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact person name" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || undefined)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 987-6543" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || undefined)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-diagnostic-purple">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Insurance provider and policy details" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || undefined)} className="border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Previous medical conditions, allergies, medications, surgical history... (one per line)"
                          className="min-h-[120px] border border-gray-300 focus-visible:ring-2 focus-visible:ring-ring"
                          value={Array.isArray(field.value) ? field.value.join('\n') : (typeof field.value === 'string' ? field.value : '')}
                          onChange={(e) => field.onChange(e.target.value)}
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
                disabled={updatePatientMutation.isPending}
              >
                {updatePatientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}