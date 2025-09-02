import { useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Brain, ArrowLeft, Activity, AlertCircle, CheckCircle2, Eye, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Patient } from '@shared/schema';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useAiAnalysisById } from '@/services/use-ai-diagnose';
import { useQuery } from '@tanstack/react-query';

interface ConditionProbability { label: string; value: number }

function pct(n?: number | null) {
  if (n == null) return 0;
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  const v = num <= 1 ? num : num / 100;
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function titleCase(s?: string | null) {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const palette = ['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)','var(--chart-5)'];

// severityBadge previously unused; removed to avoid lint warnings

// Robust date parsing to prevent "Invalid time value" when backend sends null/empty/invalid date
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Attempt direct Date parse
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    // Try adding Z if it looks like ISO without timezone
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:/i.test(trimmed) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      d = new Date(trimmed + 'Z');
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function safeFormat(value: unknown, fmt: string): string {
  const d = parseDate(value);
  if (!d) return '—';
  try { return format(d, fmt); } catch { return '—'; }
}

// Ensure numeric input converted & finite
function toNumber(v: any, fallback = 0): number {
  const n = typeof v === 'string' && v.trim().endsWith('%') ? parseFloat(v) / 100 : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toConfidencePercent(rawVal: any): number {
  const n = toNumber(rawVal, NaN); // may be fraction 0-1 or already percent
  if (Number.isNaN(n)) return 0;
  return pct(n) * 100; // pct handles both fraction / percent
}

export default function AiDiagnosisDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/ai-diagnosis/:id');
  const id = params?.id || '';

  const { data: analysisRaw, isLoading: loadingAnalysis, isError: errorAnalysis } = useAiAnalysisById(id);
  const { data: patients } = useQuery<Patient[]>({ queryKey: ['/api/patients'] });

  // Map backend snake_case to camelCase the component expects
  const analysis = useMemo(() => {
    if (!analysisRaw) return undefined;
    const raw: any = analysisRaw; // allow both naming conventions
    const pick = (snake: string, camel: string) => raw[snake] !== undefined ? raw[snake] : raw[camel];
    return {
      id: raw.id,
      clinicId: pick('clinic_id','clinicId'),
      patientId: pick('patient_id','patientId'),
      doctorId: pick('doctor_id','doctorId'),
      analyzedBy: pick('analyzed_by','analyzedBy') ?? 'AI Model',
      imageUrl: pick('image_url','imageUrl'),
      imageMetadata: pick('image_metadata','imageMetadata'),
      drPrediction: pick('dr_prediction','drPrediction'),
      drConfidence: toConfidencePercent(pick('dr_confidence','drConfidence')),
      drProbability: pick('dr_probability','drProbability') as Record<string, number> | undefined,
      drSeverityLevel: pick('dr_severity_level','drSeverityLevel'),
      drDoctorNote: pick('dr_doctor_note','drDoctorNote'),
      glaucomaPrediction: pick('glaucoma_prediction','glaucomaPrediction'),
      glaucomaConfidence: toConfidencePercent(pick('glaucoma_confidence','glaucomaConfidence')),
      glaucomaProbability: pick('glaucoma_probability','glaucomaProbability'),
      glaucomaSeverityLevel: pick('glaucoma_severity_level','glaucomaSeverityLevel'),
      glaucomaDoctorNote: pick('glaucoma_doctor_note','glaucomaDoctorNote'),
      riskLevel: pick('risk_level','riskLevel'),
      clinicalNotes: pick('clinical_notes','clinicalNotes'),
      status: raw.status,
      createdAt: pick('created_at','createdAt'),
      updatedAt: pick('updated_at','updatedAt'),
    };
  }, [analysisRaw]);

  const patient = useMemo(
    () => patients?.find(p => p.id === analysis?.patientId),
    [patients, analysis]
  );

  // DR probability rows from object map
  const drProbRows = useMemo<ConditionProbability[]>(() => {
    if (!analysis?.drProbability) return [];
    return Object.entries(analysis.drProbability)
      .map(([k, v]) => ({ label: k, value: pct(v) }))
      .sort((a, b) => b.value - a.value);
  }, [analysis]);

  // Glaucoma probability: backend returns a single number (probability of glaucoma)
  // Create two-class distribution: Normal vs Glaucoma
  const glaucomaProbRows = useMemo<ConditionProbability[]>(() => {
    if (analysis?.glaucomaProbability == null) return [];
    const g = pct(analysis.glaucomaProbability);
    if (!Number.isFinite(g)) return [];
    const normal = 1 - g;
    return [
      { label: 'Normal', value: normal < 0 ? 0 : normal },
      { label: 'Glaucoma', value: g },
    ];
  }, [analysis]);

  const combinedRows = useMemo(() => {
    return [...drProbRows, ...glaucomaProbRows].slice(0, 14);
  }, [drProbRows, glaucomaProbRows]);

  const riskTone = (risk?: string | null) => {
    switch (risk) {
      case 'low': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'moderate': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      case 'high': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200';
    }
  };

  if (loadingAnalysis) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-72 bg-muted rounded" />
          <div className="h-40 w-full bg-muted rounded" />
          <div className="h-80 w-full bg-muted rounded" />
        </div>
      </main>
    );
  }

  if (errorAnalysis) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">Failed to load analysis.</div>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/ai-diagnosis')}>Back</Button>
        </div>
      </main>
    );
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

  const riskLabel = titleCase(analysis.riskLevel);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
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
          {analysis.drPrediction && (
            <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue">
              DR: {analysis.drPrediction}
            </Badge>
          )}
          {analysis.glaucomaPrediction && (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
              Glaucoma: {analysis.glaucomaPrediction}
            </Badge>
          )}
          <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${riskTone(analysis.riskLevel)}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> Risk: {riskLabel || '—'}
          </span>
          {analysis.status !== 'completed' ? (
            <Badge className="bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Side panel (left) */}
        <aside className="space-y-6 lg:col-span-4 xl:col-span-3 self-start lg:sticky lg:top-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Patient & Clinical Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between"><span className="text-gray-500">Patient</span><span className="font-medium truncate max-w-[140px] text-right">{patient ? `${patient.firstName} ${patient.lastName}` : analysis.patientId || '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Date</span><span>{safeFormat(analysis.createdAt, 'PP')}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Time</span><span>{safeFormat(analysis.createdAt, 'p')}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Analyzed By</span><span>{analysis.analyzedBy}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Status</span><span className="capitalize">{analysis.status}</span></div>
              </div>
              <div className="border-t pt-4">
                <p className="text-[11px] font-semibold tracking-wide text-gray-600 mb-1">AI SUMMARY</p>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-6" title={analysis.clinicalNotes}>{analysis.clinicalNotes}</p>
              </div>
              {analysis.drDoctorNote || analysis.glaucomaDoctorNote ? (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-[11px] font-semibold tracking-wide text-diagnostic-purple mb-1">DOCTOR NOTES</p>
                  {analysis.drDoctorNote && <p className="text-xs text-professional-dark whitespace-pre-line">{analysis.drDoctorNote}</p>}
                  {analysis.glaucomaDoctorNote && <p className="text-xs text-professional-dark whitespace-pre-line">{analysis.glaucomaDoctorNote}</p>}
                </div>
              ) : null}
              <div className="border-t pt-3 text-[11px] text-gray-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5" />
                <span>This AI output is for clinical decision support and should be reviewed by a qualified professional.</span>
              </div>
            </CardContent>
          </Card>
        </aside>

  {/* Main charts area (right) */}
  <div className="space-y-8 lg:col-span-8 xl:col-span-9">
          {/* Model Confidence - Converted to Bar Chart */}
          <Card className="overflow-hidden relative">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ChartContainer className="h-full !aspect-auto" config={{ dr:{ label:'DR', color:'var(--chart-1)' }, glaucoma:{ label:'Glaucoma', color:'var(--chart-2)' } }}>
                  <BarChart data={[{
                    label:'Confidence',
                    dr: Number.isFinite(analysis.drConfidence)? Number(analysis.drConfidence.toFixed(2)):0,
                    glaucoma: Number.isFinite(analysis.glaucomaConfidence)? Number(analysis.glaucomaConfidence.toFixed(2)):0,
                    drPrediction: analysis.drPrediction || '—',
                    glaucomaPrediction: analysis.glaucomaPrediction || '—',
                    risk: riskLabel || '—'
                  }]} margin={{ left: 16, right: 16, top: 24, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={false} />
                    <YAxis domain={[0,100]} tickFormatter={(v:number)=> `${v}%`} width={45} />
                    <ChartTooltip
                      cursor={{ fill: 'transparent' }}
                      content={<ChartTooltipContent hideLabel formatter={(val, name, _item, _idx, payload: any)=> {
                        const prediction = name === 'DR' ? payload.drPrediction : payload.glaucomaPrediction;
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{name} Model</span>
                            <span className="text-[11px] text-muted-foreground">Prediction: {prediction}</span>
                            {payload.risk && name === 'DR' && (
                              <span className="text-[11px] text-muted-foreground">Overall Risk: {payload.risk}</span>
                            )}
                            <span className="font-mono">{Math.round(val as number)}%</span>
                          </div>
                        );
                      }} />}
                    />
                    <Bar dataKey="dr" name="DR" fill="var(--chart-1)" radius={[4,4,0,0]}>
                      <LabelList dataKey="dr" position="top" formatter={(v:number)=> `${Math.round(v)}%`} className="fill-professional-dark text-[11px]" />
                    </Bar>
                    <Bar dataKey="glaucoma" name="Glaucoma" fill="var(--chart-2)" radius={[4,4,0,0]}>
                      <LabelList dataKey="glaucoma" position="top" formatter={(v:number)=> `${Math.round(v)}%`} className="fill-professional-dark text-[11px]" />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                <div className="p-2 rounded border bg-white flex flex-col gap-1">
                  <span className="text-gray-500">DR Prediction</span>
                  <span className="font-semibold text-professional-dark flex items-center gap-1">{analysis.drPrediction || '—'} <span className="text-[11px] font-normal text-gray-500">({Number.isFinite(analysis.drConfidence)? Math.round(analysis.drConfidence):0}%)</span></span>
                </div>
                <div className="p-2 rounded border bg-white flex flex-col gap-1">
                  <span className="text-gray-500">Glaucoma Prediction</span>
                  <span className="font-semibold text-professional-dark flex items-center gap-1">{analysis.glaucomaPrediction || '—'} <span className="text-[11px] font-normal text-gray-500">({Number.isFinite(analysis.glaucomaConfidence)? Math.round(analysis.glaucomaConfidence):0}%)</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DR Probability */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-diagnostic-purple" /> DR Class Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {drProbRows.length === 0 ? (
                <p className="text-sm text-gray-500">No DR probability data.</p>
              ) : (
                <div className="h-80">
                  <ChartContainer className="h-full !aspect-auto" config={drProbRows.reduce((acc,it,i)=>{const key=it.label.replace(/[^a-zA-Z0-9_-]/g,'_');acc[key]={label:it.label,color:palette[i%palette.length]};return acc},{} as any)}>
                    <BarChart data={drProbRows.map(p=>({ name:p.label, pct:+(p.value*100).toFixed(2) }))} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={140} />
                      <Bar dataKey="pct" radius={[0,4,4,0]}>
                        {drProbRows.map((_,i)=>(<Cell key={i} fill={palette[i%palette.length]} />))}
                        <LabelList dataKey="pct" position="right" formatter={(v:number)=> `${Number.isFinite(v)? v:0}%`} className="fill-professional-dark text-[10px]" />
                      </Bar>
                      <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Glaucoma Probability */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-medical-blue" /> Glaucoma Probability</CardTitle>
            </CardHeader>
            <CardContent>
              {glaucomaProbRows.length === 0 ? (
                <p className="text-sm text-gray-500">No glaucoma probability data.</p>
              ) : (
                <div className="h-60">
                  <ChartContainer className="h-full !aspect-auto" config={glaucomaProbRows.reduce((acc,it,i)=>{const key=it.label.replace(/[^a-zA-Z0-9_-]/g,'_');acc[key]={label:it.label,color:palette[i%palette.length]};return acc},{} as any)}>
                    <BarChart data={glaucomaProbRows.map(p=>({ name:p.label, pct:+(p.value*100).toFixed(2) }))} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Bar dataKey="pct" radius={[0,4,4,0]}>
                        {glaucomaProbRows.map((_,i)=>(<Cell key={i} fill={palette[i%palette.length]} />))}
                        <LabelList dataKey="pct" position="right" formatter={(v:number)=> `${Number.isFinite(v)? v:0}%`} className="fill-professional-dark text-[10px]" />
                      </Bar>
                      <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Combined small multiples */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Combined Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              {combinedRows.length === 0 ? (
                <p className="text-sm text-gray-500">No probability data.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {combinedRows.map((p, i) => (
                    <div key={p.label} className="rounded-md border p-2">
                      <div className="text-[11px] text-gray-600 truncate">{p.label}</div>
                      <div className="h-14">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ name: p.label, pct: +(p.value*100).toFixed(2) }]}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Bar dataKey="pct" radius={[4,4,0,0]} maxBarSize={18}>
                              <Cell fill={palette[i % palette.length]} />
                              <LabelList dataKey="pct" position="top" formatter={(v:number)=> `${Number.isFinite(v)? v:0}%`} className="fill-professional-dark text-[10px]" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Metadata & Timings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Technical Metadata & Timings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysis.imageMetadata ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><p className="text-gray-500">Request ID</p><p className="font-mono mt-0.5">{analysis.imageMetadata.request_id || '—'}</p></div>
                    <div><p className="text-gray-500">Model Version</p><p className="mt-0.5">{analysis.imageMetadata.model_version || '—'}</p></div>
                    <div><p className="text-gray-500">Image Size</p><p className="mt-0.5">{analysis.imageMetadata.image_size || '—'}</p></div>
                    <div><p className="text-gray-500">Inference Time</p><p className="mt-0.5">{analysis.imageMetadata.inference_time_ms} ms</p></div>
                    <div className="col-span-2"><p className="text-gray-500">Optimizations</p><p className="mt-0.5 text-[11px]">{(analysis.imageMetadata.optimizations_applied||[]).join(', ') || '—'}</p></div>
                  </div>
                  {analysis.imageMetadata.timing ? (
                    <div className="h-56">
                      <ChartContainer className="!aspect-auto" config={{ image_loading_ms:{label:'Image Load',color:palette[0]}, dr_prediction_ms:{label:'DR Predict',color:palette[1]}, glaucoma_prediction_ms:{label:'Glaucoma Predict',color:palette[2]} }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { stage: 'Image Load', ms: analysis.imageMetadata.timing.image_loading_ms },
                            { stage: 'DR Prediction', ms: analysis.imageMetadata.timing.dr_prediction_ms },
                            { stage: 'Glaucoma Prediction', ms: analysis.imageMetadata.timing.glaucoma_prediction_ms }
                          ]} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v:number)=> `${v}ms`} width={50} />
                            <Bar dataKey="ms" radius={[4,4,0,0]}>
                              <Cell fill={palette[0]} />
                              <Cell fill={palette[1]} />
                              <Cell fill={palette[2]} />
                            </Bar>
                            <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  ) : null}
                </>
              ) : <p className="text-sm text-gray-500">No metadata available.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
