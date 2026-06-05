'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CreateVisitDialog } from '@/components/visits/create-visit-dialog'
import { VisitStatusBadge, VisitTypeBadge } from '@/components/visits/visit-badges'
import { VisitRowActions } from '@/components/visits/visit-row-actions'
import { Input } from '@/components/ui/input'
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
import { MODALITY_LABELS, TYPE_LABELS } from '@/features/visits/constants'
import { useVisits } from '@/features/visits/hooks'
import type { VisitAssignment } from '@/features/visits/types'

const ALL = 'ALL'

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function teamLabel(assignments: VisitAssignment[]): string {
  if (assignments.length === 0) return '—'
  const lead = assignments.find((a) => a.isLead) ?? assignments[0]
  const extra = assignments.length - 1
  return extra > 0 ? `${lead.user.fullName} +${extra}` : lead.user.fullName
}

export default function AgendaPage() {
  const [date, setDate] = useState('')
  const [type, setType] = useState<string>(ALL)

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10))
  }, [])

  const { data, isLoading, isError } = useVisits({
    from: date ? `${date}T00:00:00.000Z` : undefined,
    to: date ? `${date}T23:59:59.999Z` : undefined,
    type: type === ALL ? undefined : type,
    pageSize: 100,
  })

  const visits = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Visitas programadas por día.</p>
        </div>
        <CreateVisitDialog defaultDateTime={date ? `${date}T09:00` : undefined} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="sm:max-w-44"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || !date) &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-danger">
                  No se pudieron cargar las visitas.
                </TableCell>
              </TableRow>
            )}

            {date && !isLoading && !isError && visits.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No hay visitas para este día.
                </TableCell>
              </TableRow>
            )}

            {visits.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{fmtTime(v.scheduledDate)}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/visitas/${v.id}`} className="hover:underline">
                    {v.patient.firstName} {v.patient.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  <VisitTypeBadge type={v.type} reason={v.reason} />
                </TableCell>
                <TableCell className="text-muted-foreground">{MODALITY_LABELS[v.modality]}</TableCell>
                <TableCell>
                  <VisitStatusBadge status={v.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{teamLabel(v.assignments)}</TableCell>
                <TableCell>
                  <VisitRowActions visit={v} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
