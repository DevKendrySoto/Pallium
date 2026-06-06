'use client'

import { Loader2, MapPin, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDispatchRouteFromDashboard } from '@/features/dashboard/hooks'
import { routesTodayDataSchema } from '@/features/dashboard/types'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  PLANNED: 'Planificada',
  DISPATCHED: 'Despachada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export function RoutesTodayWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const dispatch = useDispatchRouteFromDashboard()
  const [busyId, setBusyId] = useState<string | null>(null)
  const parsed = routesTodayDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { routes, total } = parsed.data

  async function onDispatch(id: string) {
    setBusyId(id)
    try {
      await dispatch.mutateAsync({ id })
      toast.success('Ruta despachada al chofer por WhatsApp')
    } catch {
      /* el wrapper de API ya muestra el error */
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Rutas de hoy</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {routes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay rutas para hoy.</p>
        ) : (
          <div className="space-y-2">
            {routes.map((route) => (
              <div key={route.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
                <button
                  type="button"
                  onClick={() => router.push(`/routes/${route.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium hover:underline">
                    {route.name ?? 'Ruta'}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={14} /> {route.stops} paradas · {route.driverName ?? 'Sin chofer'}
                  </p>
                </button>
                <Badge variant="outline">{STATUS_LABEL[route.status] ?? route.status}</Badge>
                {route.canDispatch && (
                  <Button
                    size="sm"
                    className="min-h-[44px] sm:min-h-9"
                    disabled={busyId === route.id}
                    onClick={() => onDispatch(route.id)}
                  >
                    {busyId === route.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {route.dispatchedAt ? 'Reenviar' : 'Despachar'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
