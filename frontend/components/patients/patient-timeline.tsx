'use client'

import {
  ArrowRightLeft,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  Gauge,
  Pill,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientTimeline } from '@/features/patients/timeline'
import type { TimelineEventType } from '@/types/timeline'

const ICONS: Record<TimelineEventType, React.ComponentType<{ size?: number }>> = {
  REGISTRATION: UserPlus,
  ADMISSION_APPROVED: CheckCircle2,
  STATUS_CHANGE: ArrowRightLeft,
  VISIT_SCHEDULED: CalendarPlus,
  VISIT_COMPLETED: CalendarCheck,
  CLINICAL_NOTE: ClipboardList,
  SCALE_ASSESSMENT: Gauge,
  ALERT_RAISED: TriangleAlert,
  ALERT_RESOLVED: ShieldCheck,
  DIAGNOSIS_ADDED: Stethoscope,
  MEDICATION_CHANGE: Pill,
  DOCUMENT_UPLOADED: FileText,
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PatientTimeline({ patientId }: { patientId: string }) {
  const { data, isLoading, isError } = usePatientTimeline(patientId)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Historial</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {isError && <p className="text-sm text-danger">No se pudo cargar el historial.</p>}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
        )}

        {data && data.length > 0 && (
          <ol className="relative space-y-5 border-l border-slate-200 pl-6">
            {data.map((event) => {
              const Icon = ICONS[event.type] ?? Circle
              return (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-background text-muted-foreground">
                    <Icon size={14} />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {fmt(event.occurredAt)}
                      {event.actor ? ` · ${event.actor.fullName}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
