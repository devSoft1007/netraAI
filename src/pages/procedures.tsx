import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, Plus, Filter, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AddProcedureModal from "@/components/modals/add-procedure-modal";
import EditProcedureModal from "@/components/modals/edit-procedure-modal";
import type { Patient } from "@/shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useProcedures, { type Procedure } from "@/services/procedures/use-procedure";

export default function Procedures() {
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: proceduresResponse, isLoading } = useProcedures();
  const procedures = proceduresResponse?.data?.procedures || [];

  const patients: any[] = []; // Replace with actual patient data fetching logic
  // const { data: patients } = useQuery<Patient[]>({
  //   queryKey: ['/api/patients'],
  // });

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: Patient) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const deleteProcedureMutation = useMutation({
    mutationFn: async (procedureId: string) => {
      const response = await apiRequest('DELETE', `/api/procedures/${procedureId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procedures'] });
      toast({
        title: "Procedure Deleted",
        description: "The procedure has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the procedure. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditProcedure = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setIsEditModalOpen(true);
  };

  const handleDeleteProcedure = (procedureId: string) => {
    if (confirm("Are you sure you want to delete this procedure?")) {
      deleteProcedureMutation.mutate(procedureId);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading procedures...</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-professional-dark">Procedure Management</h1>
          <p className="text-gray-600 mt-1">Track and manage medical procedures</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0 medical-button-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Procedure
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter by Status
        </Button>
      </div>

      {procedures?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No procedures recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {procedures?.map((procedure: Procedure) => (
            <Card key={procedure.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{procedure.procedureName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient: {procedure.patient ? procedure.patient.name : getPatientName(procedure.patient?.id || '')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(procedure.status)}>
                      {procedure.status.charAt(0).toUpperCase() + procedure.status.slice(1)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProcedure(procedure)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProcedure(procedure.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Doctor:</span>
                    <span>{procedure.doctorName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date:</span>
                    <span>{procedure.performedDate ? format(new Date(procedure.performedDate), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  {procedure.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span>{procedure.duration} minutes</span>
                    </div>
                  )}
                  {procedure.description && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 font-medium">Description:</p>
                      <p className="text-sm text-gray-700 mt-1">{procedure.description}</p>
                    </div>
                  )}
                  {procedure.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 font-medium">Notes:</p>
                      <p className="text-sm text-gray-700 mt-1">{procedure.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProcedureModal
        patients={patients || []}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditProcedureModal
        procedure={selectedProcedure}
        patients={patients || []}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProcedure(null);
        }}
      />
    </main>
  );
}
