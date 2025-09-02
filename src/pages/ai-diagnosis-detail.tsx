import { useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Brain, ArrowLeft, Activity, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Patient } from '@shared/schema';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell } from 'recharts';
import { format } from 'date-fns';
import { useAiAnalysisById } from '@/services/use-ai-diagnose';
import { useQuery } from '@tanstack/react-query';

// Mock probability breakdown shape (adapt if backend supplies richer data)
interface ConditionProbability { label: string; value: number }

export default function AiDiagnosisDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/ai-diagnosis/:id');
  const id = params?.id || '';

  // Fetch single analysis via Edge Function hook
  const { data: analysis, isLoading: loadingAnalysis, isError: errorAnalysis } = useAiAnalysisById(id);
  const { data: patients } = useQuery<Patient[]>({ queryKey: ['/api/patients'] });
  const patient = useMemo(() => patients?.find(p => p.id === analysis?.patientId), [patients, analysis]);

  // Demo probability data derived from confidence + severity (placeholder logic)
  const probabilityData: ConditionProbability[] = useMemo(() => {
    if (!analysis) return [];
    // Prefer real DR probability map if available; synthesize glaucoma 2-class distribution
    const rows: ConditionProbability[] = []
    if (analysis.drProbability) {
      Object.entries(analysis.drProbability).forEach(([k,v]) => {
        rows.push({ label: k, value: v <= 1 ? v : v/100 })
      })
    }
    if (analysis.glaucomaProbability) {
      Object.entries(analysis.glaucomaProbability).forEach(([k,v]) => {
        rows.push({ label: `Glaucoma: ${k}`, value: v <= 1 ? v : v/100 })
      })
    }
    return rows.slice(0,12)
  }, [analysis]);

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingAnalysis) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-gray-500">Loading analysis...</div>
      </main>
    )
  }

  if (errorAnalysis) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">Failed to load analysis.</div>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/ai-diagnosis')}>Back</Button>
        </div>
      </main>
    )
  }

  if (!analysis) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/ai-diagnosis')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Analyses
        </Button>
        <div className="text-center py-24 border rounded-lg bg-white">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Analysis not found</p>
          <Button onClick={() => navigate('/ai-diagnosis')} variant="outline">Return to list</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ai-diagnosis')} className="-ml-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-professional-dark flex items-center gap-2">
              <Brain className="w-5 h-5 text-diagnostic-purple" /> Detailed AI Analysis
            </h1>
            <p className="text-gray-500 text-sm">Comprehensive diagnostic breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={severityColor(analysis.severity)}>{analysis.severity}</Badge>
          <Badge variant="secondary" className="bg-diagnostic-purple/10 text-diagnostic-purple">{analysis.confidence}% Confidence</Badge>
          {analysis.reviewedByDoctor ? (
            <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Reviewed</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" /> Pending Review</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left column: key metrics & patient */}
        <div className="space-y-8 xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Patient Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-500">Patient</span><span className="font-medium">{patient ? `${patient.firstName} ${patient.lastName}` : analysis.patientId}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Analysis Date</span><span>{format(new Date(analysis.createdAt), 'PPpp')}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Analyzed By</span><span>{analysis.analyzedBy}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Reviewed</span><span>{analysis.reviewedByDoctor ? 'Yes' : 'No'}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Clinical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {analysis.diagnosis}
              </p>
              {analysis.doctorNotes ? (
                <div className="mt-4 p-3 rounded-md bg-diagnostic-purple/5 border border-diagnostic-purple/20">
                  <p className="text-xs uppercase tracking-wide text-diagnostic-purple font-medium mb-1">Doctor Notes</p>
                  <p className="text-sm text-professional-dark whitespace-pre-line">{analysis.doctorNotes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right column: charts & probabilities */}
        <div className="space-y-8 lg:col-span-2">
          {/* DR Detail */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-diagnostic-purple" /> Diabetic Retinopathy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-gray-500">Prediction</p><p className="font-medium mt-0.5">{analysis.drPrediction || '—'}</p></div>
                <div><p className="text-gray-500">Confidence</p><p className="font-medium mt-0.5">{analysis.drConfidence != null ? (analysis.drConfidence).toFixed(1)+'%' : '—'}</p></div>
                <div><p className="text-gray-500">Severity Level</p><p className="font-medium mt-0.5">{analysis.drSeverityLevel ?? '—'}</p></div>
                <div><p className="text-gray-500">Risk Level</p><p className="font-medium mt-0.5 capitalize">{analysis.riskLevel || '—'}</p></div>
              </div>
              {analysis.drDoctorNote && (
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 whitespace-pre-line">
                  {analysis.drDoctorNote}
                </div>
              )}
              {analysis.drProbability ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Class Probabilities</p>
                  {Object.entries(analysis.drProbability).sort((a,b)=> (b[1]||0)-(a[1]||0)).map(([k,v])=>{
                    const pct = v <=1 ? v*100 : v
                    return (
                      <div key={k} className="flex items-center gap-3 text-[11px]">
                        <span className="w-36 truncate" title={k}>{k}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-diagnostic-purple/80 rounded-full" style={{width: pct+'%'}} />
                        </div>
                        <span className="w-12 text-right tabular-nums">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-xs text-gray-400 italic">No DR probability data</p>}
            </CardContent>
          </Card>

          {/* Glaucoma Detail */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-medical-blue" /> Glaucoma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-gray-500">Prediction</p><p className="font-medium mt-0.5">{analysis.glaucomaPrediction || '—'}</p></div>
                <div><p className="text-gray-500">Confidence</p><p className="font-medium mt-0.5">{analysis.glaucomaConfidence != null ? (analysis.glaucomaConfidence).toFixed(1)+'%' : '—'}</p></div>
                <div><p className="text-gray-500">Severity Level</p><p className="font-medium mt-0.5">{analysis.glaucomaSeverityLevel ?? '—'}</p></div>
                <div><p className="text-gray-500">Status</p><p className="font-medium mt-0.5 capitalize">{analysis.status || '—'}</p></div>
              </div>
              {analysis.glaucomaDoctorNote && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200 text-xs text-green-800 whitespace-pre-line">
                  {analysis.glaucomaDoctorNote}
                </div>
              )}
              {analysis.glaucomaProbability ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Probability</p>
                  {Object.entries(analysis.glaucomaProbability).sort((a,b)=> (b[1]||0)-(a[1]||0)).map(([k,v])=>{
                    const pct = v <=1 ? v*100 : v
                    return (
                      <div key={k} className="flex items-center gap-3 text-[11px]">
                        <span className="w-28 truncate" title={k}>{k}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-medical-blue/80 rounded-full" style={{width: pct+'%'}} />
                        </div>
                        <span className="w-12 text-right tabular-nums">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-xs text-gray-400 italic">No glaucoma probability data</p>}
            </CardContent>
          </Card>

          {/* Combined Probability Chart */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Combined Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {probabilityData.length === 0 ? (
                <p className="text-sm text-gray-500">No probability data.</p>
              ) : (
                <div className="h-80 w-full overflow-hidden">
                  <ChartContainer
                    className="!aspect-auto"
                    config={probabilityData.reduce((acc, item, i) => { acc[item.label] = { label: item.label, color: `hsl(var(--chart-${(i%5)+1}))` }; return acc }, {} as any)}
                  >
                    <BarChart data={probabilityData.map(p => ({ name: p.label, value: +(p.value*100).toFixed(2) }))} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(v: number) => `${v}%`} width={40} />
                      <Bar dataKey="value" radius={[4,4,0,0]}> 
                        {probabilityData.map((_, idx) => (
                          <Cell key={idx} fill={`hsl(var(--chart-${(idx%5)+1}))`} />
                        ))}
                      </Bar>
                      <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Technical Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.imageMetadata ? (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><p className="text-gray-500">Request ID</p><p className="font-mono mt-0.5">{analysis.imageMetadata.request_id || '—'}</p></div>
                  <div><p className="text-gray-500">Model Version</p><p className="mt-0.5">{analysis.imageMetadata.model_version || '—'}</p></div>
                  <div><p className="text-gray-500">Image Size</p><p className="mt-0.5">{analysis.imageMetadata.image_size || '—'}</p></div>
                  <div><p className="text-gray-500">Inference Time</p><p className="mt-0.5">{analysis.imageMetadata.inference_time_ms} ms</p></div>
                  <div className="col-span-2"><p className="text-gray-500">Optimizations</p><p className="mt-0.5 text-[11px]">{(analysis.imageMetadata.optimizations_applied||[]).join(', ') || '—'}</p></div>
                </div>
              ) : <p className="text-sm text-gray-500">No metadata available.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
