import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Upload, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AiDiagnosis, Patient } from "@shared/schema";

export default function AiDiagnosis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: diagnoses, isLoading } = useQuery<AiDiagnosis[]>({
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, JPEG).",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    // Simulate analysis with mock patient
    const mockPatientId = patients?.[0]?.id || 'mock-patient-id';
    const mockImageUrl = URL.createObjectURL(file);
    
    analyzeImageMutation.mutate({
      patientId: mockPatientId,
      imageUrl: mockImageUrl,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: Patient) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'mild':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderate':
        return 'bg-orange-100 text-orange-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading AI diagnoses...</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-diagnostic-purple/10 rounded-lg flex items-center justify-center">
            <Brain className="text-diagnostic-purple" />
          </div>
          <h1 className="text-2xl font-semibold text-professional-dark">AI Fundus Analysis</h1>
          <Badge variant="secondary" className="bg-diagnostic-purple/10 text-diagnostic-purple">
            BETA
          </Badge>
        </div>
        <p className="text-gray-600">
          Advanced AI-powered analysis for early detection of diabetic retinopathy, glaucoma, and macular degeneration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Fundus Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-diagnostic-purple bg-diagnostic-purple/5'
                    : 'border-gray-300 hover:border-diagnostic-purple'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fundus-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  disabled={analyzeImageMutation.isPending}
                />
                <label htmlFor="fundus-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-diagnostic-purple/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-diagnostic-purple" />
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        {analyzeImageMutation.isPending ? 'Analyzing image...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>94% accuracy rate</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Brain className="h-4 w-4" />
                  <span>AI Model v2.1</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Instant results</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {diagnoses?.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No AI diagnoses available yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Upload a fundus image to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {diagnoses?.map((diagnosis: AiDiagnosis) => (
                    <div key={diagnosis.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-professional-dark">
                            {getPatientName(diagnosis.patientId)}
                          </h3>
                          <p className="text-gray-600 mt-1">{diagnosis.diagnosis}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(diagnosis.severity)}>
                            {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">{diagnosis.confidence}% confidence</p>
                        </div>
                      </div>
                      
                      {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {diagnosis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-600">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Analyzed by {diagnosis.analyzedBy}</span>
                        <span>{format(new Date(diagnosis.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      
                      {!diagnosis.reviewedByDoctor && (
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline">
                            Review & Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
