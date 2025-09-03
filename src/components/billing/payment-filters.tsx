import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Replaced Radix Popover with Floating UI for better viewport handling
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useFloating, offset, flip, shift, size, autoUpdate, FloatingPortal } from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface PaymentFiltersState {
  status: string[];
  method: string[];
  from?: string;
  to?: string;
  invoiceNumber?: string;
  patientId?: string; // future patient selector
  limit: number;
}

interface PaymentFiltersProps {
  value: PaymentFiltersState;
  onChange: (next: PaymentFiltersState) => void;
  onReset?: () => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [ 'paid', 'pending', 'partial', 'overdue' ];
const METHOD_OPTIONS = [ 'cash', 'card', 'insurance', 'check' ];

export function PaymentFilters({ value, onChange, onReset, disabled }: PaymentFiltersProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile?.() ?? false;
  const [draft, setDraft] = useState<PaymentFiltersState>(value);

  // Floating UI setup (desktop only)
  const { refs, floatingStyles } = useFloating({
    open: open && !isMobile,
    onOpenChange: (o) => setOpen(o),
    placement: 'bottom-end' as Placement,
    middleware: [
      offset(8),
      flip({ padding: 12, fallbackAxisSideDirection: 'end' }),
      shift({ padding: 12 }),
      size({
        padding: 12,
        apply: ({ elements, availableHeight, availableWidth }) => {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight, 600)}px`,
            width: 'min(26rem, 95vw)',
            maxWidth: `${Math.min(availableWidth, 416)}px`,
          });
        }
      })
    ],
    whileElementsMounted: autoUpdate
  });

  // Close on Escape (allow internal portal interactions like Radix Select without collapsing popover)
  useEffect(() => {
    if (!open || isMobile) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [open, isMobile]);

  useEffect(() => { setDraft(value); }, [value]);

  // Track Select (page size) open state to avoid closing popover prematurely
  const [selectOpen, setSelectOpen] = useState(false);

  // Outside click to close (desktop), but ignore while Select dropdown is open
  useEffect(() => {
    if (!open || isMobile) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (selectOpen) return; // keep filters open while page size select active
      const refEl = (refs as any).reference?.current as HTMLElement | null;
      const floatEl = (refs as any).floating?.current as HTMLElement | null;
      const target = e.target as Node;
      if (floatEl?.contains(target) || refEl?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
    };
  }, [open, isMobile, selectOpen, refs]);

  const toggleArrayVal = (key: keyof PaymentFiltersState, item: string) => {
    setDraft(prev => {
      const arr = (prev[key] as string[]) || [];
      const next: PaymentFiltersState = { ...prev, [key]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] } as PaymentFiltersState;
      onChange(next); // auto apply
      return next;
    });
  };


  const reset = () => {
    const cleared: PaymentFiltersState = { status: [], method: [], limit: value.limit };
    setDraft(cleared);
    onChange(cleared);
    onReset?.();
  };

  // Debounce invoiceNumber / date range changes for auto apply
  useEffect(() => {
    const id = setTimeout(() => {
      onChange(draft);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.invoiceNumber, draft.from, draft.to]);

  const triggerButton = (
    <Button
      variant="outline"
      disabled={disabled}
      className="gap-2"
  ref={refs.setReference as any}
      onClick={() => setOpen(o => !o)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? 'payment-filters-popover' : undefined}
    >
      <Filter className="h-4 w-4" />
      Filters
      {(value.status.length || value.method.length || value.from || value.to || value.invoiceNumber) && (
        <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-medical-blue/10 px-2 text-xs font-medium text-medical-blue">
          {value.status.length + value.method.length + (value.from?1:0) + (value.to?1:0) + (value.invoiceNumber?1:0)}
        </span>
      )}
    </Button>
  );

  const contentBody = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-professional-dark">Payment Filters</h4>
        <Button variant="ghost" size="sm" onClick={reset} className="text-xs">Reset</Button>
      </div>
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        <div>
          <Label className="text-xs uppercase text-gray-500">Status</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(s => (
              <label key={s} className="flex items-center space-x-2 rounded border p-2 hover:bg-muted cursor-pointer">
                <Checkbox checked={draft.status.includes(s)} onCheckedChange={() => toggleArrayVal('status', s)} />
                <span className="text-sm capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase text-gray-500">Method</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {METHOD_OPTIONS.map(m => (
              <label key={m} className="flex items-center space-x-2 rounded border p-2 hover:bg-muted cursor-pointer">
                <Checkbox checked={draft.method.includes(m)} onCheckedChange={() => toggleArrayVal('method', m)} />
                <span className="text-sm capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="from" className="text-xs uppercase text-gray-500">From</Label>
            <Input id="from" type="date" value={draft.from || ''} onChange={e => setDraft(p => ({ ...p, from: e.target.value || undefined }))} />
          </div>
          <div>
            <Label htmlFor="to" className="text-xs uppercase text-gray-500">To</Label>
            <Input id="to" type="date" value={draft.to || ''} onChange={e => setDraft(p => ({ ...p, to: e.target.value || undefined }))} />
          </div>
        </div>
        <div>
          <Label htmlFor="invoice" className="text-xs uppercase text-gray-500">Invoice Number</Label>
          <Input id="invoice" placeholder="INV-..." value={draft.invoiceNumber || ''} onChange={e => setDraft(p => ({ ...p, invoiceNumber: e.target.value || undefined }))} />
        </div>
        <div>
          <Label className="text-xs uppercase text-gray-500">Page Size</Label>
          <Select open={selectOpen} onOpenChange={setSelectOpen} value={String(draft.limit)} onValueChange={(v) => setDraft(p => { const next = { ...p, limit: Number(v) } as PaymentFiltersState; onChange(next); return next; })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10,20,30,50,100].map(l => <SelectItem key={l} value={String(l)}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
  <Button size="sm" variant="secondary" onClick={reset}>Reset</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{contentBody}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      {triggerButton}
      {open && (
        <FloatingPortal>
          <div
            id="payment-filters-popover"
            ref={refs.setFloating as any}
            style={floatingStyles}
            role="dialog"
            aria-label="Payment Filters"
            className="z-50 rounded-md border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in zoom-in p-4 space-y-4 overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {contentBody}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default PaymentFilters;