import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddPatientModal from "@/components/modals/add-patient-modal";
import PatientModal from "@/components/modals/patient-modal";
import { usePatients, usePatient } from "@/services/use-patient/use-patient";
import type { Patient as FullPatient } from "@shared/schema";
import { transformDatesFromAPI } from "@shared/schema";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FullPatient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: patientsData, isLoading } = usePatients({
    page: currentPage,
    limit: 12,
    search: debouncedSearch,
    status: statusFilter
  });

  const patients = patientsData?.data?.patients || [];
  const pagination = patientsData?.data?.pagination;

  // Fetch a single, full patient record when needed using the usePatient hook
  const { data: fullPatientData } = usePatient(selectedPatient?.id || "");

  const modalPatient: FullPatient | null = (() => {
    if (!selectedPatient) return null;
    if (!fullPatientData) return selectedPatient;

    const fetched: any = fullPatientData;

    if (Array.isArray(fetched) && fetched.length > 0 && fetched[0]?.id) {
      return transformDatesFromAPI(fetched[0]) as FullPatient;
    }

    if (fetched && typeof fetched === 'object' && fetched.id) {
      return transformDatesFromAPI(fetched) as FullPatient;
    }

    return transformDatesFromAPI(selectedPatient) as FullPatient;
  })();

  const handleStatusFilterChange = (newStatus: 'active' | 'inactive' | 'all') => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
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
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('all')}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('active')}
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {patients?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {debouncedSearch ? 'No patients found matching your search.' : 'No patients registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients?.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // When a card is clicked, set a lightweight selected patient and open the modal.
                  // The modal uses queries to fetch full patient details by id.
                  setSelectedPatient({
                    id: patient.id,
                    firstName: patient.name.split(' ')[0] || '',
                    lastName: patient.name.split(' ').slice(1).join(' ') || '',
                    email: patient.email || '',
                    phone: patient.phone || '',
                    dateOfBirth: new Date(), // fallback, modal will refetch full data
                    gender: patient.gender || 'Unknown',
                    address: patient.address || '',
                    insuranceProvider: patient.insurance || undefined,
                    insurancePolicyNumber: undefined,
                    insuranceGroupNumber: undefined,
                    emergencyContactName: undefined,
                    emergencyContactPhone: undefined,
                    medicalHistory: undefined,
                    allergies: [],
                    currentMedications: [],
                    memberSince: new Date(patient.memberSince || new Date().toISOString()),
                    isActive: patient.isActive,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as FullPatient);
                  setIsPatientModalOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-medical-blue">
                          {patient.initials}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{patient.name}</CardTitle>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                    </div>
                    <Badge variant={patient.isActive ? "default" : "secondary"}>
                      {patient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Age:</span>
                      <span>{patient.age || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Phone:</span>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Insurance:</span>
                      <span>{patient.insurance || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Member since:</span>
                      <span>{patient.memberSince || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <PatientModal
        patient={modalPatient}
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedPatient(null);
        }}
      />
    </main>
  );
}
