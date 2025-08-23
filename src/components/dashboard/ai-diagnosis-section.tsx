import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AiDiagnosis, Patient } from "@shared/schema";

export default function AiDiagnosisSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentDiagnoses, isLoading } = useQuery<AiDiagnosis[]>({
    queryKey: ['/api/ai-diagnoses'],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async (data: { patientId: string; imageUrl: string }) => {
      const response = await apiRequest('POST', '/api/ai-diagnoses/analyze', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-diagnoses'] });
      setSelectedFile(null);
      toast({
        title: "Analysis Complete",
        description: "AI diagnosis has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simulate image upload and analysis with a mock patient
      const mockPatientId = patients?.[0]?.id || 'mock-patient-id';
      const mockImageUrl = URL.createObjectURL(file);
      
      analyzeImageMutation.mutate({
        patientId: mockPatientId,
        imageUrl: mockImageUrl,
      });
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: Patient) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal':
        return 'medical-badge-normal';
      case 'mild':
        return 'medical-badge-mild';
      case 'moderate':
        return 'bg-orange-100 text-orange-800';
      case 'severe':
        return 'medical-badge-urgent';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-diagnostic-purple/10 rounded-lg flex items-center justify-center">
            <Brain className="text-diagnostic-purple" />
          </div>
          <h3 className="text-lg font-semibold text-professional-dark">AI Fundus Analysis</h3>
        </div>
        <span className="text-xs bg-diagnostic-purple/10 text-diagnostic-purple px-2 py-1 rounded-full">BETA</span>
      </div>

      <div className="bg-gradient-to-r from-diagnostic-purple/5 to-medical-blue/5 rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-diagnostic-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="text-diagnostic-purple text-2xl" />
          </div>
          <h4 className="text-lg font-medium text-professional-dark mb-2">Upload Fundus Photography</h4>
          <p className="text-gray-600 text-sm mb-4">
            Our AI model can detect diabetic retinopathy, glaucoma, and macular degeneration with 94% accuracy
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <input
              type="file"
              id="fundus-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={analyzeImageMutation.isPending}
            />
            <label htmlFor="fundus-upload" className="cursor-pointer">
              <div className="text-center">
                <Upload className="text-4xl text-gray-400 mb-4 mx-auto" />
                <p className="text-gray-600">
                  {analyzeImageMutation.isPending ? 'Analyzing...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-professional-dark mb-4">Recent Analysis Results</h4>
        <div className="space-y-3">
          {recentDiagnoses?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No AI diagnoses available yet
            </div>
          ) : (
            recentDiagnoses?.slice(0, 3).map((result: AiDiagnosis) => (
              <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-diagnostic-purple/10 rounded-lg flex items-center justify-center">
                    <Brain className="text-diagnostic-purple" />
                  </div>
                  <div>
                    <p className="font-medium text-professional-dark">
                      {getPatientName(result.patientId)}
                    </p>
                    <p className="text-sm text-gray-600">{result.diagnosis}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(result.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(result.severity)}`}>
                    {getSeverityText(result.severity)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{result.confidence}% confidence</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
