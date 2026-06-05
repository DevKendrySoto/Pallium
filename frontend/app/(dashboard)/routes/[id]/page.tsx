'use client'

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CreateDriverDialog } from '@/components/routes/create-driver-dialog'
import { RouteStatusBadge } from '@/components/routes/route-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DISPATCH_STATUS_LABELS, isEditableRoute } from '@/features/routes/constants'
import {
  useAssignClinicalTeam,
  useAssignDriver,
  useChangeRouteStatus,
  useClinicalStaff,
  useDispatchRoute,
  useDrivers,
  useRemoveStop,
  useReorderStops,
  useRoute,
} from '@/features/routes/hooks'
import { useHasPermission } from '@/hooks/use-permission'
import { useReadOnly } from '@/hooks/use-read-only'

const UNASSIGNED = 'none'
const NO_TEAM_PERMISSION = 'Solo el coordinador médico puede asignar el equipo clínico.'

function fmtTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const readOnly = useReadOnly()
  const { data: route, isLoading, isError } = useRoute(id)
  const drivers = useDrivers()
  const assignDriver = useAssignDriver(id)
  const canAssignTeam = useHasPermission('route:assign-clinical-team')
  const clinicalStaff = useClinicalStaff(canAssignTeam)
  const assignTeam = useAssignClinicalTeam(id)
  const changeStatus = useChangeRouteStatus(id)
  const removeStop = useRemoveStop(id)
  const reorder = useReorderStops(id)
  const dispatch = useDispatchRoute(id)

  function move(index: number, dir: -1 | 1) {
    if (!route) return
    const ids = route.stops.map((s) => s.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  const editable = !readOnly && (route ? isEditableRoute(route.status) : false)
  const canDispatch =
    !readOnly &&
    route &&
    route.driver &&
    route.stops.length > 0 &&
    ['PLANNED', 'DISPATCHED'].includes(route.status)
  const lastDispatch = route?.dispatches[0]

  return (
    <div className="space-y-6">
      <Link
        href="/routes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Rutas
      </Link>

      {isLoading && <Skeleton className="h-48 w-full" />}
      {isError && <p className="text-sm text-danger">No se pudo cargar la ruta.</p>}

      {route && (
        <>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {route.name ?? `Ruta ${route.routeDate.slice(0, 10)}`}
                </h1>
                <RouteStatusBadge status={route.status} />
              </div>
              <p className="text-sm text-muted-foreground">{route.routeDate.slice(0, 10)}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {!readOnly && route.status === 'DRAFT' && (
                <Button variant="outline" onClick={() => changeStatus.mutate('PLANNED')}>
                  Planificar
                </Button>
              )}
              {!readOnly && route.status === 'DISPATCHED' && (
                <Button variant="outline" onClick={() => changeStatus.mutate('IN_PROGRESS')}>
                  Iniciar
                </Button>
              )}
              {!readOnly && route.status === 'IN_PROGRESS' && (
                <Button variant="outline" onClick={() => changeStatus.mutate('COMPLETED')}>
                  Completar
                </Button>
              )}
              {canDispatch && (
                <Button onClick={() => dispatch.mutate(undefined)} disabled={dispatch.isPending}>
                  {dispatch.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {route.status === 'DISPATCHED' ? 'Reenviar' : 'Despachar'} WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* Chofer */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Chofer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {editable ? (
                <>
                  <Select
                    value={route.driver?.id ?? ''}
                    onValueChange={(v) => assignDriver.mutate(v)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Asignar chofer" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.data?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.fullName} · {d.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CreateDriverDialog onCreated={(driverId) => assignDriver.mutate(driverId)} />
                </>
              ) : (
                <p className="text-sm">
                  {route.driver ? `${route.driver.fullName} · ${route.driver.phone}` : 'Sin asignar'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Equipo clínico — solo ADMIN y COORDINADOR_MEDICO pueden cambiarlo */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Equipo clínico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1" title={canAssignTeam ? undefined : NO_TEAM_PERMISSION}>
                <p className="text-xs text-muted-foreground">Médico asignado</p>
                {canAssignTeam ? (
                  <Select
                    value={route.assignedMedical?.id ?? UNASSIGNED}
                    onValueChange={(v) =>
                      assignTeam.mutate({ medicalId: v === UNASSIGNED ? null : v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                      {clinicalStaff.data?.medical.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{route.assignedMedical?.fullName ?? 'Sin asignar'}</p>
                )}
              </div>
              <div className="space-y-1" title={canAssignTeam ? undefined : NO_TEAM_PERMISSION}>
                <p className="text-xs text-muted-foreground">Enfermera asignada</p>
                {canAssignTeam ? (
                  <Select
                    value={route.assignedNursing?.id ?? UNASSIGNED}
                    onValueChange={(v) =>
                      assignTeam.mutate({ nursingId: v === UNASSIGNED ? null : v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                      {clinicalStaff.data?.nursing.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{route.assignedNursing?.fullName ?? 'Sin asignar'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paradas */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Paradas ({route.stops.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {route.stops.length === 0 && (
                <p className="text-sm text-muted-foreground">La ruta no tiene paradas.</p>
              )}
              {route.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-3 rounded-md border border-slate-200 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {stop.sequence}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {stop.visit.patient.firstName} {stop.visit.patient.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {fmtTime(stop.plannedArrival)}
                      {stop.visit.address
                        ? ` · ${stop.visit.address.line1}, ${stop.visit.address.city}`
                        : ' · sin dirección'}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <ChevronUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === route.stops.length - 1 || reorder.isPending}
                        onClick={() => move(index, 1)}
                      >
                        <ChevronDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger"
                        onClick={() => removeStop.mutate(stop.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Último despacho */}
          {lastDispatch && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Último despacho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {DISPATCH_STATUS_LABELS[lastDispatch.status]} · {lastDispatch.toPhone}
                  {lastDispatch.sentAt ? ` · ${new Date(lastDispatch.sentAt).toLocaleString('es')}` : ''}
                </p>
                {lastDispatch.error && <p className="text-sm text-danger">{lastDispatch.error}</p>}
                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                  {lastDispatch.message}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
