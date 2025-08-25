import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Brain, X, Eye, AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AiDiagnosis, Patient } from "@shared/schema";

// Interface for your API response
interface DiagnosisResponse {
  diabetic_retinopathy: {
    prediction: string;
    confidence: number;
    probabilities: Record<string, number>;
    severity_level: number;
    doctor_note: string;
  };
  glaucoma: {
    prediction: string;
    confidence: number;
    probabilities: Record<string, number>;
    severity_level: number;
    doctor_note: string;
  };
  meta: {
    request_id: string;
    image_size: string;
    model_version: string;
    inference_time_ms: number;
    input_source: string;
    optimizations_applied: string[];
    timing: {
      image_loading_ms: number;
      dr_prediction_ms: number;
      glaucoma_prediction_ms: number;
    };
  };
}

export default function AiDiagnosisSection() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DiagnosisResponse | null>(null);
  const { toast } = useToast();

  // const { data: recentDiagnoses, isLoading } = useQuery<AiDiagnosis[]>({
  //   queryKey: ['/'],
  // });
  const recentDiagnoses: any = []

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // ✅ ADD THIS MISSING FUNCTION
  const getSeverityFromResponse = (data: DiagnosisResponse): string => {
    const drSeverity = data.diabetic_retinopathy.severity_level;
    const glaucomaSeverity = data.glaucoma.severity_level;
    
    // Determine overall severity based on highest individual severity
    const maxSeverity = Math.max(drSeverity, glaucomaSeverity);
    
    if (maxSeverity === 0) return 'normal';
    if (maxSeverity === 1) return 'mild';
    if (maxSeverity === 2) return 'moderate';
    if (maxSeverity >= 3) return 'severe';
    return 'normal';
  };

  const analyzeImageMutation = useMutation({
    mutationFn: async (file: File): Promise<DiagnosisResponse> => {
      const response = await apiRequest('POST', '/api/ai-diagnoses', file);
      return response.json();
    },
    onSuccess: (data: DiagnosisResponse) => {
      setAnalysisResult(data);
      
      // Transform and save to your database
      const diagnosisData = {
        patientId: patients?.[0]?.id || 'mock-patient-id',
        imageUrl: previewUrl || '',
        diagnosis: `DR: ${data.diabetic_retinopathy.prediction}, Glaucoma: ${data.glaucoma.prediction}`,
        severity: getSeverityFromResponse(data),
        confidence: Math.round((data.diabetic_retinopathy.confidence + data.glaucoma.confidence) / 2 * 100),
        details: {
          diabetic_retinopathy: data.diabetic_retinopathy,
          glaucoma: data.glaucoma,
          meta: data.meta
        }
      };
      
      toast({
        title: "Analysis Complete",
        description: "Image has been successfully analyzed.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, JPEG).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setAnalysisResult(null); // Clear previous results
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      analyzeImageMutation.mutate(selectedFile);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
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

  const getConditionIcon = (condition: string) => {
    if (condition.toLowerCase().includes('normal') || condition.toLowerCase() === 'no dr') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getConditionBadgeColor = (severityLevel: number) => {
    if (severityLevel === 0) return 'bg-green-100 text-green-800 border-green-200';
    if (severityLevel === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (severityLevel === 2) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (severityLevel >= 3) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                type="file"
                id="fundus-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label htmlFor="fundus-upload" className="cursor-pointer">
                <div className="text-center">
                  <Upload className="text-4xl text-gray-400 mb-4 mx-auto" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Fundus preview"
                  className="max-w-full max-h-64 rounded-lg shadow-md"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* File Info */}
              <div className="text-sm text-gray-600">
                <p><strong>File:</strong> {selectedFile?.name}</p>
                <p><strong>Size:</strong> {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB</p>
              </div>

              {/* Analyze Button */}
              {!analysisResult && (
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeImageMutation.isPending}
                    className="bg-diagnostic-purple hover:bg-diagnostic-purple/90"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {analyzeImageMutation.isPending ? 'Analyzing...' : 'Analyze Image'}
                  </Button>
                  
                  <Button
                    onClick={handleRemoveImage}
                    variant="outline"
                    disabled={analyzeImageMutation.isPending}
                  >
                    Upload Different Image
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-professional-dark flex items-center">
              <Eye className="w-5 h-5 mr-2 text-diagnostic-purple" />
              Analysis Results
            </h4>
            <Button
              onClick={handleRemoveImage}
              variant="outline"
              size="sm"
            >
              New Analysis
            </Button>
          </div>

          {/* Diabetic Retinopathy Results */}
          <div className="medical-card bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getConditionIcon(analysisResult.diabetic_retinopathy.prediction)}
                <h5 className="font-medium text-professional-dark">Diabetic Retinopathy</h5>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionBadgeColor(analysisResult.diabetic_retinopathy.severity_level)}`}>
                {analysisResult.diabetic_retinopathy.prediction}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className="text-sm font-medium">{(analysisResult.diabetic_retinopathy.confidence * 100).toFixed(1)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-diagnostic-purple h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisResult.diabetic_retinopathy.confidence * 100}%` }}
                ></div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{analysisResult.diabetic_retinopathy.doctor_note}</p>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="space-y-2">
                <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Probability Breakdown</h6>
                {Object.entries(analysisResult.diabetic_retinopathy.probabilities).map(([condition, probability]) => (
                  <div key={condition} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{condition}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-diagnostic-purple h-1 rounded-full"
                          style={{ width: `${(probability as number) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-800 font-medium min-w-[3rem] text-right">
                        {((probability as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glaucoma Results */}
          <div className="medical-card bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getConditionIcon(analysisResult.glaucoma.prediction)}
                <h5 className="font-medium text-professional-dark">Glaucoma</h5>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionBadgeColor(analysisResult.glaucoma.severity_level)}`}>
                {analysisResult.glaucoma.prediction}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className="text-sm font-medium">{(analysisResult.glaucoma.confidence * 100).toFixed(1)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-medical-blue h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisResult.glaucoma.confidence * 100}%` }}
                ></div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-800">{analysisResult.glaucoma.doctor_note}</p>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="space-y-2">
                <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Probability Breakdown</h6>
                {Object.entries(analysisResult.glaucoma.probabilities).map(([condition, probability]) => (
                  <div key={condition} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{condition}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-medical-blue h-1 rounded-full"
                          style={{ width: `${(probability as number) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-800 font-medium min-w-[3rem] text-right">
                        {((probability as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h6 className="text-sm font-medium text-gray-700">Analysis Details</h6>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Request ID:</span>
                <p className="font-mono text-gray-800">{analysisResult.meta.request_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Processing Time:</span>
                <p className="text-gray-800">{analysisResult.meta.inference_time_ms}ms</p>
              </div>
              <div>
                <span className="text-gray-500">Image Size:</span>
                <p className="text-gray-800">{analysisResult.meta.image_size}</p>
              </div>
              <div>
                <span className="text-gray-500">Model Version:</span>
                <p className="text-gray-800">{analysisResult.meta.model_version}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
