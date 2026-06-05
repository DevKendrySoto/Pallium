'use client'

import { CheckCircle2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSelection } from '@/components/dashboard/dashboard-context'
import { todayVisitsDataSchema, type TodayVisitItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  EN_ROUTE: 'En camino',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  NO_SHOW: 'No realizada',
}

function VisitCard({ visit, onSelect, selected }: { visit: TodayVisitItem; onSelect: () => void; selected: boolean }) {
  const done = visit.status === 'COMPLETED'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
        'min-h-[44px] hover:bg-slate-50',
        selected ? 'border-primary ring-1 ring-primary' : 'border-slate-200',
        done && 'opacity-70',
      )}
    >
      {visit.routeOrder != null && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
          {visit.routeOrder}
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-medium">{visit.patient.fullName}</span>
          {visit.patient.age != null && (
            <span className="shrink-0 text-sm text-muted-foreground">{visit.patient.age} años</span>
          )}
        </div>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <MapPin size={14} className="shrink-0" />
          {visit.patient.addressShort ?? 'Sin dirección'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium">{fmtTime(visit.scheduledAt)}</span>
        <div className="flex items-center gap-1">
          {visit.type === 'EXTRAORDINARY' && <Badge variant="outline">Extra</Badge>}
          <Badge variant="outline" className={cn(done && 'border-success text-success')}>
            {done && <CheckCircle2 size={12} className="mr-1" />}
            {STATUS_LABEL[visit.status] ?? visit.status}
          </Badge>
        </div>
      </div>
    </button>
  )
}

export function TodayVisitsWidget({ data }: { data: unknown }) {
  const parsed = todayVisitsDataSchema.safeParse(data)
  const { selectedVisit, selectVisit } = useDashboardSelection()
  if (!parsed.success) return null
  const { visits, total, completed } = parsed.data

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mi día</h2>
          <p className="text-sm text-muted-foreground">
            {completed} de {total} visitas completadas
          </p>
        </div>

        {total === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tienes visitas asignadas hoy.
          </p>
        )}

        {total > 0 && completed === total && (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-success/10 py-8 text-center">
            <CheckCircle2 className="text-success" />
            <p className="font-medium">Completaste todas tus visitas. Buen trabajo.</p>
            <p className="text-sm text-muted-foreground">{total} visitas atendidas hoy.</p>
          </div>
        )}

        {visits.length > 0 && (
          <div className="space-y-2">
            {visits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                selected={selectedVisit?.id === visit.id}
                onSelect={() => selectVisit(visit)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TodayVisitsSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
