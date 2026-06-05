import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ROUTE_STATUS_LABELS, ROUTE_STATUS_STYLES } from '@/features/routes/constants'
import type { RouteStatus } from '@/features/routes/types'

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', ROUTE_STATUS_STYLES[status])}>
      {ROUTE_STATUS_LABELS[status]}
    </Badge>
  )
}
