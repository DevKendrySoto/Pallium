import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/features/patients/constants'
import type { PatientStatus } from '@/types/patient'

const STYLES: Record<PatientStatus, string> = {
  ACTIVE: 'border-transparent bg-success text-success-foreground',
  PENDING_APPROVAL: 'border-transparent bg-warning text-warning-foreground',
  PASSIVE: 'border-slate-200 bg-slate-100 text-slate-700',
  DECEASED: 'border-transparent bg-danger text-danger-foreground',
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
