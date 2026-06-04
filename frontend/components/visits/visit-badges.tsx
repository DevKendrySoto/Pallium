import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { REASON_LABELS, TYPE_LABELS, VISIT_STATUS_LABELS } from '@/features/visits/constants'
import type { ExtraordinaryReason, Visit, VisitStatus } from '@/features/visits/types'

const STATUS_STYLES: Record<VisitStatus, string> = {
  SCHEDULED: 'border-transparent bg-primary/10 text-primary',
  CONFIRMED: 'border-transparent bg-primary/10 text-primary',
  EN_ROUTE: 'border-transparent bg-primary/10 text-primary',
  IN_PROGRESS: 'border-transparent bg-warning/15 text-amber-700',
  COMPLETED: 'border-transparent bg-success text-success-foreground',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  NO_SHOW: 'border-transparent bg-danger/10 text-danger',
  RESCHEDULED: 'border-slate-200 bg-slate-100 text-slate-600',
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[status])}>
      {VISIT_STATUS_LABELS[status]}
    </Badge>
  )
}

export function VisitTypeBadge({ type, reason }: { type: Visit['type']; reason: ExtraordinaryReason | null }) {
  const isExtra = type === 'EXTRAORDINARY'
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        isExtra ? 'border-warning/40 text-amber-700' : 'border-slate-200 text-slate-600',
      )}
    >
      {TYPE_LABELS[type]}
      {isExtra && reason ? ` · ${REASON_LABELS[reason]}` : ''}
    </Badge>
  )
}
