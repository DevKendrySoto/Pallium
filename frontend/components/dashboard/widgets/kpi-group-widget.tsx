'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { kpiGroupDataSchema, type WidgetSeverity } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

const SEVERITY_BORDER: Record<WidgetSeverity, string> = {
  info: 'border-l-sky-400',
  low: 'border-l-slate-300',
  medium: 'border-l-amber-400',
  high: 'border-l-orange-500',
  critical: 'border-l-danger',
}

export function KpiGroupWidget({ data }: { data: unknown }) {
  const parsed = kpiGroupDataSchema.safeParse(data)
  if (!parsed.success) return null

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {parsed.data.items.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            'border-slate-200 border-l-4',
            kpi.severity ? SEVERITY_BORDER[kpi.severity] : 'border-l-slate-200',
          )}
        >
          <CardContent className="space-y-1 pt-6">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="text-3xl font-semibold tracking-tight">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function KpiGroupSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-slate-200">
          <CardContent className="space-y-2 pt-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
