'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { useAudit } from '@/features/audit'

const ALL = 'ALL'
const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'STATUS_TRANSITION',
  'DISPATCH',
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function AuditPage() {
  const [action, setAction] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAudit({
    action: action === ALL ? undefined : action,
    page,
  })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Bitácora de acciones del sistema.</p>
      </div>

      <Select
        value={action}
        onValueChange={(v) => {
          setAction(v)
          setPage(1)
        }}
      >
        <SelectTrigger className="sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las acciones</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-danger">
                  No se pudo cargar la bitácora.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground">{fmt(e.createdAt)}</TableCell>
                <TableCell className="font-mono text-xs">{e.action}</TableCell>
                <TableCell className="text-muted-foreground">
                  {e.entityType}
                  {e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ''}
                </TableCell>
                <TableCell>{e.actor?.fullName ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.ipAddress ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} registros</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
