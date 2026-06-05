import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from '@/features/alerts/constants'
import type { AlertSeverity, AlertStatus } from '@/types/alert'

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Badge variant="outline" className={cn('font-medium', SEVERITY_STYLES[severity])}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
