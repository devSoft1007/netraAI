import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddPatientModal from "@/components/modals/add-patient-modal";
import PatientModal from "@/components/modals/patient-modal";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const filteredPatients = patients?.filter((patient: Patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading patients...</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-professional-dark">Patient Management</h1>
          <p className="text-gray-600 mt-1">Manage patient records and medical history</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0 medical-button-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Patient
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {filteredPatients?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients?.map((patient: Patient) => (
            <Card 
              key={patient.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPatient(patient);
                setIsPatientModalOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-medical-blue">
                        {getInitials(patient.firstName, patient.lastName)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{patient.firstName} {patient.lastName}</CardTitle>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                    </div>
                  </div>
                  <Badge variant={patient.isActive ? "default" : "secondary"}>
                    {patient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Age:</span>
                    <span>{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Insurance:</span>
                    <span>{patient.insuranceProvider || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member since:</span>
                    <span>{new Date(patient.memberSince).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <PatientModal
        patient={selectedPatient}
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedPatient(null);
        }}
      />
    </main>
  );
}
