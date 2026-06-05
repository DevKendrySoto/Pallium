'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BuildRouteDialog } from '@/components/routes/build-route-dialog'
import { RouteStatusBadge } from '@/components/routes/route-status-badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRoutes } from '@/features/routes/hooks'

export default function RoutesPage() {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10))
  }, [])

  const { data, isLoading, isError } = useRoutes({ date: date || undefined })
  const routes = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rutas</h1>
          <p className="text-sm text-muted-foreground">Rutas de visitas domiciliarias.</p>
        </div>
        <BuildRouteDialog defaultDate={date} />
      </div>

      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="sm:max-w-44"
      />

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ruta</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead>Paradas</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || !date) &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-danger">
                  No se pudieron cargar las rutas.
                </TableCell>
              </TableRow>
            )}

            {date && !isLoading && !isError && routes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No hay rutas para este día.
                </TableCell>
              </TableRow>
            )}

            {routes.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/routes/${r.id}`} className="font-medium hover:underline">
                    {r.name ?? `Ruta ${r.routeDate.slice(0, 10)}`}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.driver?.fullName ?? 'Sin asignar'}
                </TableCell>
                <TableCell className="text-muted-foreground">{r._count.stops}</TableCell>
                <TableCell>
                  <RouteStatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
