import React from 'react'

export const MetricCardSkeleton: React.FC = () => (
  <div className="rounded-lg border p-4 animate-pulse space-y-4 h-full">
    <div className="h-3 w-24 bg-muted rounded" />
    <div className="flex items-center justify-between">
      <div className="h-7 w-32 bg-muted rounded" />
      <div className="h-8 w-8 bg-muted rounded-lg" />
    </div>
    <div className="h-3 w-20 bg-muted rounded" />
  </div>
)

export const PaymentRowSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 animate-pulse space-y-3">
    <div className="flex justify-between">
      <div className="space-y-2 w-full pr-4">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="flex gap-4 mt-1">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-5 w-24 bg-muted rounded ml-auto" />
        <div className="h-5 w-16 bg-muted rounded ml-auto" />
        <div className="h-3 w-24 bg-muted rounded ml-auto" />
      </div>
    </div>
    <div className="h-px bg-muted" />
    <div className="flex gap-6 text-sm">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  </div>
)

export const PaymentsListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => <PaymentRowSkeleton key={i} />)}
  </div>
)

export const InlineLoaderBar: React.FC = () => (
  <div className="h-1 w-full overflow-hidden rounded bg-muted relative">
    <div className="absolute inset-0 animate-[progress_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
  </div>
)

// Tailwind keyframes (if not already present globally, consumer can add) - kept as comment reference:
// @keyframes progress { from { transform: translateX(-100%);} to { transform: translateX(100%);} }

export default PaymentsListSkeleton