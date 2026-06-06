'use client'

import { ChevronRight, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { routesUnassignedDataSchema } from '@/features/dashboard/types'

export function RoutesUnassignedWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const parsed = routesUnassignedDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { routes, total } = parsed.data

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Rutas sin equipo clínico</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {routes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todas las rutas de hoy tienen equipo asignado.
          </p>
        ) : (
          <div className="space-y-2">
            {routes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => router.push(`/routes/${r.id}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
              >
                <Users size={18} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name ?? 'Ruta'}</p>
                  <p className="text-xs text-muted-foreground">{r.stops} paradas</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.missingMedical && <Badge variant="outline">Falta médico</Badge>}
                  {r.missingNursing && <Badge variant="outline">Falta enfermera</Badge>}
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
