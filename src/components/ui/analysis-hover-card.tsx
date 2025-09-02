import React, { useState, useRef } from 'react'
import { useFloating, offset, shift, flip, arrow, autoUpdate, useHover, useInteractions, safePolygon, FloatingPortal } from '@floating-ui/react'
import type { Placement } from '@floating-ui/react'
import { Brain, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProbabilityMap { [k: string]: number }

export interface AnalysisHoverData {
  id: string
  diagnosis: string
  createdAt: Date
  analyzedBy: string
  confidence: number
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
  drPrediction?: string | null
  drConfidence?: number | null
  drProbability?: ProbabilityMap | null
  glaucomaPrediction?: string | null
  glaucomaConfidence?: number | null
  glaucomaProbability?: ProbabilityMap | null
  riskLevel?: string | null
  doctorNotes?: string
  status?: string | null
  imageUrl?: string
}

interface AnalysisHoverCardProps {
  data: AnalysisHoverData
  children: React.ReactNode
  placement?: Placement
  className?: string
}

export const AnalysisHoverCard: React.FC<AnalysisHoverCardProps> = ({ data, children, placement = 'right', className }) => {
  const [open, setOpen] = useState(false)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate
  })

  // Use hover interactions with safePolygon so moving cursor from trigger to card (across small gap) doesn't close immediately
  const hover = useHover(context, { handleClose: safePolygon({ buffer: 4 }) })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover])

  // Format confidence (0-1 or 0-100)
  const formatConf = (v?: number | null) => {
    if (v == null) return '—'
    return v <= 1 ? (v * 100).toFixed(1) + '%' : v.toFixed(1) + '%'
  }

  const severityBadge = (sev: AnalysisHoverData['severity']) => {
    const map: Record<string, string> = {
      normal: 'medical-badge-normal',
      mild: 'medical-badge-mild',
      moderate: 'bg-orange-100 text-orange-800',
      severe: 'medical-badge-urgent'
    }
    return map[sev] || 'bg-gray-100 text-gray-800'
  }

  // Reusable probability list renderer
  const ProbabilityList = ({ probs, accent }: { probs: ProbabilityMap | null | undefined; accent: 'dr' | 'gl' }) => {
    if (!probs) return <p className="mt-2 text-[11px] text-gray-400 italic">No probability data</p>
    const entries = Object.entries(probs).filter(([,v]) => typeof v === 'number').sort((a,b) => (b[1]||0) - (a[1]||0)).slice(0,5)
    if (!entries.length) return <p className="mt-2 text-[11px] text-gray-400 italic">No probability data</p>
    const barColor = accent === 'dr' ? 'bg-diagnostic-purple' : 'bg-medical-blue'
    return (
      <div className="mt-2 space-y-1">
        {entries.map(([k,v]) => {
          const pct = v <= 1 ? v * 100 : v
          return (
            <div key={k} className="grid grid-cols-[140px_1fr_42px] items-center gap-2 text-[11px]">
              <span className="truncate text-gray-500" title={k}>{k}</span>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={cn('h-1.5 rounded-full transition-all', barColor)} style={{ width: `${Math.min(pct,100)}%` }} />
              </div>
              <span className="tabular-nums text-gray-600 text-[10px] text-right">{pct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={refs.setReference}
      {...getReferenceProps()}
      className={cn('group/analysis relative', className)}
    >
      {children}
      {open && (
        // Render the floating card in a portal attached to document.body to avoid clipping / stacking issues
        <FloatingPortal>
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-50 w-[420px] max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-xl p-4 animate-in fade-in-0 zoom-in-95"
        >
          <header className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-md bg-diagnostic-purple/10 flex items-center justify-center shrink-0"><Brain className="w-4 h-4 text-diagnostic-purple" /></div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-professional-dark leading-tight pr-6 break-words">{data.diagnosis}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span>{data.createdAt.toLocaleString()}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                  <span>{data.analyzedBy}</span>
                </div>
              </div>
            </div>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', severityBadge(data.severity))}>{data.severity}</span>
          </header>

          <div className="space-y-5 text-xs">
            <section>
              <h6 className="font-semibold text-gray-700 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Diabetic Retinopathy</h6>
              <dl className="grid grid-cols-[90px_1fr] gap-y-1 gap-x-2">
                <dt className="text-gray-500">Prediction</dt><dd className="font-medium break-words">{data.drPrediction || '—'}</dd>
                <dt className="text-gray-500">Confidence</dt><dd>{formatConf(data.drConfidence)}</dd>
              </dl>
              <ProbabilityList probs={data.drProbability} accent="dr" />
            </section>
            <section className="pt-4 border-t border-gray-100">
              <h6 className="font-semibold text-gray-700 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Glaucoma</h6>
              <dl className="grid grid-cols-[90px_1fr] gap-y-1 gap-x-2">
                <dt className="text-gray-500">Prediction</dt><dd className="font-medium break-words">{data.glaucomaPrediction || '—'}</dd>
                <dt className="text-gray-500">Confidence</dt><dd>{formatConf(data.glaucomaConfidence)}</dd>
              </dl>
              <ProbabilityList probs={data.glaucomaProbability} accent="gl" />
            </section>
            <section className="grid grid-cols-4 gap-4 px-3 py-2 rounded-md bg-gray-50 border border-gray-100">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Risk</p>
                <p className="text-[11px] font-medium text-gray-800">{data.riskLevel || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Status</p>
                <p className="text-[11px] font-medium text-gray-800">{data.status || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Confidence</p>
                <p className="text-[11px] font-medium text-gray-800">{data.confidence}%</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Severity</p>
                <p className="text-[11px] font-medium capitalize text-gray-800">{data.severity}</p>
              </div>
            </section>
            {data.doctorNotes ? (
              <section className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Doctor Notes</p>
                <p className="text-[11px] text-gray-700 whitespace-pre-line max-h-28 overflow-y-auto leading-relaxed">{data.doctorNotes}</p>
              </section>
            ) : null}
          </div>

          <div
            ref={arrowRef}
            className="absolute w-3 h-3 rotate-45 bg-white shadow-sm border border-gray-200"
            style={{
              left: context.middlewareData.arrow?.x,
              top: context.middlewareData.arrow?.y,
              [context.placement.startsWith('top') ? 'bottom' : context.placement.startsWith('bottom') ? 'top' : context.placement.startsWith('left') ? 'right' : 'left']: '-5px'
            }}
          />
        </div>
        </FloatingPortal>
      )}
    </div>
  )
}

export default AnalysisHoverCard
