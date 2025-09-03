import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Patient } from "@shared/schema";

export default function PatientSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const patients: any[] = []; // Replace with actual patient data fetching logic

  // const { data: patients } = useQuery<Patient[]>({
  //   queryKey: ['/api/patients'],
  // });

  const filteredPatients = patients?.filter((patient: Patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getInitialsColor = (index: number) => {
    const colors = ['medical-blue', 'healthcare-green', 'diagnostic-purple'];
    return colors[index % colors.length];
  };

  return (
    <div className="medical-card">
      <h3 className="text-lg font-semibold text-professional-dark mb-4">Quick Patient Search</h3>
      
      <div className="relative mb-4">
        <Input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600">
          {searchTerm ? 'Search Results' : 'Recent Patients'}
        </p>
        
        {filteredPatients?.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {searchTerm ? 'No patients found' : 'No patients available'}
          </div>
        ) : (
          filteredPatients?.map((patient: Patient, index: number) => (
            <div key={patient.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-${getInitialsColor(index)}/10 rounded-full flex items-center justify-center`}>
                  <span className={`text-xs font-medium text-${getInitialsColor(index)}`}>
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-professional-dark">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last visit: {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
