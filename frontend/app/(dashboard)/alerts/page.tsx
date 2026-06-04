'use client'

import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { AlertSeverityBadge, AlertStatusBadge } from '@/components/alerts/alert-badges'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/features/alerts/constants'
import {
  useAcknowledgeAlert,
  useAlerts,
  useResolveAlert,
} from '@/features/alerts/hooks'
import type { Alert, AlertSeverity, AlertStatus, AlertType } from '@/types/alert'

const ALL = 'ALL'

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AlertActions({ alert }: { alert: Alert }) {
  const acknowledge = useAcknowledgeAlert()
  const resolve = useResolveAlert()
  const canAck = alert.status === 'OPEN'
  const canResolve = alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED'

  if (!canAck && !canResolve) return <span className="text-xs text-muted-foreground">—</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canAck && (
          <DropdownMenuItem onClick={() => acknowledge.mutate(alert.id)}>
            Reconocer
          </DropdownMenuItem>
        )}
        {canResolve && (
          <DropdownMenuItem onClick={() => resolve.mutate(alert.id)}>Resolver</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AlertsPage() {
  const [status, setStatus] = useState<AlertStatus | typeof ALL>('OPEN')
  const [severity, setSeverity] = useState<AlertSeverity | typeof ALL>(ALL)
  const [type, setType] = useState<AlertType | typeof ALL>(ALL)

  const { data, isLoading, isError } = useAlerts({
    status: status === ALL ? undefined : status,
    severity: severity === ALL ? undefined : severity,
    type: type === ALL ? undefined : type,
  })

  const alerts = data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground">Bandeja de alertas clínicas y operativas.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={status} onValueChange={(v) => setStatus(v as AlertStatus | typeof ALL)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {(Object.keys(STATUS_LABELS) as AlertStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity | typeof ALL)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda severidad</SelectItem>
            {(Object.keys(SEVERITY_LABELS) as AlertSeverity[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as AlertType | typeof ALL)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {(Object.keys(TYPE_LABELS) as AlertType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Severidad</TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-danger">
                  No se pudieron cargar las alertas.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No hay alertas con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {alerts.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <AlertSeverityBadge severity={a.severity} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{a.title}</div>
                  {a.message && (
                    <div className="text-xs text-muted-foreground">{a.message}</div>
                  )}
                </TableCell>
                <TableCell>
                  {a.patient ? (
                    <Link href={`/patients/${a.patientId}`} className="hover:underline">
                      {a.patient.firstName} {a.patient.lastName}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{TYPE_LABELS[a.type]}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {fmtDateTime(a.createdAt)}
                </TableCell>
                <TableCell>
                  <AlertStatusBadge status={a.status} />
                </TableCell>
                <TableCell>
                  <AlertActions alert={a} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
