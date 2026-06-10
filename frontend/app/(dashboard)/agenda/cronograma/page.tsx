'use client'

import { CalendarClock, ChevronLeft, ChevronRight, Loader2, MapPin, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendar, useCancelAppointment, useRescheduleAppointment } from '@/features/calendar/hooks'
import type { CalendarAppointment } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Pendiente',
  CONFIRMED: 'Confirmada',
  EN_ROUTE: 'En camino',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No respondió',
}
const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'border-success text-success',
  CANCELLED: 'border-slate-300 text-slate-500',
  NO_SHOW: 'border-danger text-danger',
}

function mondayOf(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day))
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function key(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}
function initials(name?: string | null): string {
  if (!name) return ''
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-9 rounded-md border px-3 text-sm',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )
}

function toggle(set: Set<string>, v: string): Set<string> {
  const next = new Set(set)
  if (next.has(v)) next.delete(v)
  else next.add(v)
  return next
}

export default function CronogramaPage() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [view, setView] = useState<'week' | 'day'>('week')
  const [dayIndex, setDayIndex] = useState(0)
  const [selected, setSelected] = useState<CalendarAppointment | null>(null)

  // Filtros (multi) en cliente.
  const [zones, setZones] = useState<Set<string>>(new Set())
  const [types, setTypes] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Set<string>>(new Set())
  const [professional, setProfessional] = useState('')

  const from = key(weekStart)
  const to = key(addDays(weekStart, 6))
  const { data, isLoading, isError } = useCalendar(from, to)

  // Opciones de filtro derivadas de los datos.
  const { zoneOpts, statusOpts, profOpts } = useMemo(() => {
    const z = new Set<string>(), s = new Set<string>(), p = new Map<string, string>()
    for (const d of data?.days ?? []) {
      for (const a of d.appointments) {
        if (a.zone) z.add(a.zone.id)
        s.add(a.status)
        if (a.assignedMedical) p.set(a.assignedMedical.id, a.assignedMedical.fullName)
        if (a.assignedNursing) p.set(a.assignedNursing.id, a.assignedNursing.fullName)
      }
    }
    return { zoneOpts: [...z], statusOpts: [...s], profOpts: [...p.entries()] }
  }, [data])

  function match(a: CalendarAppointment): boolean {
    if (zones.size && (!a.zone || !zones.has(a.zone.id))) return false
    if (types.size && !types.has(a.type)) return false
    if (statuses.size && !statuses.has(a.status)) return false
    if (professional && a.assignedMedical?.id !== professional && a.assignedNursing?.id !== professional) return false
    return true
  }

  const days = (data?.days ?? []).map((d) => ({ ...d, appointments: d.appointments.filter(match) }))
  const visibleDays = view === 'day' ? days.slice(dayIndex, dayIndex + 1) : days

  // Agregados recalculados sobre lo filtrado.
  const all = days.flatMap((d) => d.appointments)
  const total = all.length
  const completed = all.filter((a) => a.status === 'COMPLETED').length
  const cancelled = all.filter((a) => a.status === 'CANCELLED').length
  const noResponse = all.filter((a) => a.status === 'NO_SHOW').length
  const rate = total ? Math.round((completed / total) * 100) : 0
  const hasFilters = zones.size || types.size || statuses.size || professional

  const weekLabel = `${weekStart.toLocaleDateString('es', { day: '2-digit', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('es', { day: '2-digit', month: 'short' })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Cronograma semanal</h1>
          <p className="text-sm text-muted-foreground">Toda la clínica · {weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} /> Semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(mondayOf(new Date()))}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Semana <ChevronRight size={16} />
          </Button>
          <div className="ml-2 flex rounded-md border border-slate-200 p-0.5">
            <button type="button" onClick={() => setView('week')} className={cn('rounded px-3 py-1 text-sm', view === 'week' && 'bg-slate-100 font-medium')}>Semana</button>
            <button type="button" onClick={() => setView('day')} className={cn('rounded px-3 py-1 text-sm', view === 'day' && 'bg-slate-100 font-medium')}>Día</button>
          </div>
        </div>
      </div>

      {/* Agregados */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Visitas planeadas', value: total },
          { label: 'Completitud', value: `${rate}%` },
          { label: 'Canceladas', value: cancelled },
          { label: 'Sin respuesta', value: noResponse },
        ].map((k) => (
          <Card key={k.label} className="border-slate-200">
            <CardContent className="space-y-1 pt-5">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="sticky top-0 z-10 space-y-2 rounded-lg border border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tipo</span>
          {['REGULAR', 'EXTRAORDINARY'].map((t) => (
            <Chip key={t} label={t === 'REGULAR' ? 'Regular' : 'Extraordinaria'} active={types.has(t)} onClick={() => setTypes(toggle(types, t))} />
          ))}
        </div>
        {statusOpts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            {statusOpts.map((s) => (
              <Chip key={s} label={STATUS_LABEL[s] ?? s} active={statuses.has(s)} onClick={() => setStatuses(toggle(statuses, s))} />
            ))}
          </div>
        )}
        {zoneOpts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Zona</span>
            {zoneOpts.map((z) => (
              <Chip key={z} label={z} active={zones.has(z)} onClick={() => setZones(toggle(zones, z))} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Profesional</span>
          <select
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
            className="h-9 rounded-md border border-slate-200 px-2 text-sm"
          >
            <option value="">Todos</option>
            {profOpts.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={() => { setZones(new Set()); setTypes(new Set()); setStatuses(new Set()); setProfessional('') }}>
              <X size={14} /> Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>

      {isError && <p className="text-sm text-danger">No se pudo cargar el cronograma.</p>}

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : total === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarClock className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay visitas programadas para esta semana.</p>
            <Button onClick={() => router.push('/agenda')}>Crear visita</Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn('grid gap-3', view === 'week' ? 'lg:grid-cols-7' : 'lg:grid-cols-1')}>
          {view === 'day' && (
            <div className="flex items-center gap-2 lg:col-span-1">
              <Button variant="outline" size="sm" disabled={dayIndex === 0} onClick={() => setDayIndex(dayIndex - 1)}><ChevronLeft size={16} /></Button>
              <span className="text-sm font-medium">{new Date(days[dayIndex].date + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
              <Button variant="outline" size="sm" disabled={dayIndex >= 6} onClick={() => setDayIndex(dayIndex + 1)}><ChevronRight size={16} /></Button>
            </div>
          )}
          {visibleDays.map((d) => {
            const date = new Date(d.date + 'T00:00:00')
            return (
              <div key={d.date} className="space-y-2">
                {view === 'week' && (
                  <div className="px-1">
                    <p className="text-sm font-medium capitalize">{date.toLocaleDateString('es', { weekday: 'short' })} {date.getDate()}</p>
                    <p className="text-xs text-muted-foreground">{d.appointments.filter((a) => a.status === 'COMPLETED').length} de {d.appointments.length} completadas</p>
                  </div>
                )}
                <div className="space-y-2">
                  {d.appointments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      className={cn(
                        'block w-full rounded-md border border-l-4 border-slate-200 p-2.5 text-left transition-colors hover:bg-slate-50',
                        a.type === 'EXTRAORDINARY' ? 'border-l-orange-500' : 'border-l-slate-300',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{fmtTime(a.scheduledAt)}</span>
                        <Badge variant="outline" className={cn('text-[11px]', STATUS_STYLE[a.status])}>{STATUS_LABEL[a.status] ?? a.status}</Badge>
                      </div>
                      <p className="truncate text-sm">{a.patient.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.assignedMedical && `Dr/a. ${initials(a.assignedMedical.fullName)}`, a.assignedNursing && `Enf. ${initials(a.assignedNursing.fullName)}`].filter(Boolean).join(' · ') || 'Sin equipo'}
                      </p>
                    </button>
                  ))}
                  {d.appointments.length === 0 && view === 'week' && (
                    <p className="px-1 text-xs text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AppointmentDrawer appt={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function AppointmentDrawer({ appt, onClose }: { appt: CalendarAppointment | null; onClose: () => void }) {
  const router = useRouter()
  const reschedule = useRescheduleAppointment()
  const cancel = useCancelAppointment()
  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel'>('view')
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')

  const done = appt && ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status)

  function reset() {
    setMode('view'); setNewDate(''); setReason('')
  }
  function close() { reset(); onClose() }

  async function doReschedule() {
    if (!appt || !newDate) return
    try {
      await reschedule.mutateAsync({ id: appt.id, scheduledDate: new Date(newDate).toISOString(), reason: reason || undefined })
      toast.success('Visita reprogramada')
      close()
    } catch { /* manejado */ }
  }
  async function doCancel() {
    if (!appt || !reason.trim()) return
    try {
      await cancel.mutateAsync({ id: appt.id, reason })
      toast.success('Visita cancelada')
      close()
    } catch { /* manejado */ }
  }

  return (
    <Sheet open={appt !== null} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {appt && (
          <>
            <SheetHeader>
              <SheetTitle>{appt.patient.fullName}</SheetTitle>
              <SheetDescription>
                {new Date(appt.scheduledAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                {appt.durationMinutes ? ` · ${appt.durationMinutes} min` : ''}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Estado:</span> {STATUS_LABEL[appt.status] ?? appt.status}</p>
              <p><span className="text-muted-foreground">Tipo:</span> {appt.type === 'EXTRAORDINARY' ? 'Extraordinaria' : 'Regular'}</p>
              {appt.patient.age != null && <p><span className="text-muted-foreground">Edad:</span> {appt.patient.age} años</p>}
              {appt.patient.addressShort && <p className="flex items-center gap-1"><MapPin size={14} /> {appt.patient.addressShort}</p>}
              <p><span className="text-muted-foreground">Médico:</span> {appt.assignedMedical?.fullName ?? '—'}</p>
              <p><span className="text-muted-foreground">Enfermera:</span> {appt.assignedNursing?.fullName ?? '—'}</p>
              {appt.zone && <p><span className="text-muted-foreground">Zona:</span> {appt.zone.name}</p>}
            </div>

            {mode === 'view' && (
              <div className="mt-6 space-y-2">
                {!done && (
                  <>
                    <Button variant="outline" className="w-full justify-start" disabled={!appt.routeId} onClick={() => appt.routeId && router.push(`/routes/${appt.routeId}`)}>
                      Reasignar equipo {appt.routeId ? '' : '(sin ruta)'}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setMode('reschedule')}>Reprogramar</Button>
                    <Button variant="outline" className="w-full justify-start text-danger" onClick={() => setMode('cancel')}>Cancelar visita</Button>
                  </>
                )}
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/patients/${appt.patient.id}`)}>Ver paciente</Button>
                {appt.routeId && <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/routes/${appt.routeId}`)}>Ver ruta</Button>}
              </div>
            )}

            {mode === 'reschedule' && (
              <div className="mt-6 space-y-3">
                <div className="space-y-1"><Label>Nueva fecha y hora</Label><Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></div>
                <div className="space-y-1"><Label>Motivo (opcional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setMode('view')}>Volver</Button>
                  <Button className="flex-1" disabled={!newDate || reschedule.isPending} onClick={doReschedule}>
                    {reschedule.isPending && <Loader2 size={16} className="animate-spin" />} Confirmar
                  </Button>
                </div>
              </div>
            )}

            {mode === 'cancel' && (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">Esta acción cancela la visita. Indica el motivo.</p>
                <div className="space-y-1"><Label>Motivo (obligatorio)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setMode('view')}>Volver</Button>
                  <Button variant="destructive" className="flex-1" disabled={!reason.trim() || cancel.isPending} onClick={doCancel}>
                    {cancel.isPending && <Loader2 size={16} className="animate-spin" />} Cancelar visita
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
