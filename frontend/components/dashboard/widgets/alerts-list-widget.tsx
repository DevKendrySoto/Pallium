'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alertsListDataSchema, type WidgetSeverity } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

const SEVERITY_BAND: Record<WidgetSeverity, string> = {
  info: 'border-l-sky-400',
  low: 'border-l-slate-300',
  medium: 'border-l-amber-400',
  high: 'border-l-orange-500',
  critical: 'border-l-danger',
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

export function AlertsListWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const parsed = alertsListDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { alerts, total } = parsed.data

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Alertas</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin alertas abiertas.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => router.push(`/patients/${alert.patient.id}?tab=historial`)}
                className={cn(
                  'block w-full rounded-md border border-l-4 border-slate-200 p-3 text-left transition-colors hover:bg-slate-50',
                  SEVERITY_BAND[alert.severity],
                )}
              >
                <p className="truncate text-sm font-medium">{alert.title}</p>
                <p className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{alert.patient.name}</span>
                  <span className="shrink-0">{relativeTime(alert.triggeredAt)}</span>
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AlertsListSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
