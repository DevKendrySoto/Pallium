'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResolveAlert } from '@/features/dashboard/hooks'
import { escalatedAlertsDataSchema, type WidgetSeverity } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

const SEVERITY_BAND: Record<WidgetSeverity, string> = {
  info: 'border-l-sky-400',
  low: 'border-l-slate-300',
  medium: 'border-l-amber-400',
  high: 'border-l-orange-500',
  critical: 'border-l-danger',
}

export function EscalatedAlertsWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const resolve = useResolveAlert()
  const [busyId, setBusyId] = useState<string | null>(null)
  const parsed = escalatedAlertsDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { items, total } = parsed.data

  async function onResolve(id: string) {
    setBusyId(id)
    try {
      await resolve.mutateAsync({ id })
      toast.success('Alerta resuelta')
    } catch {
      /* manejado por el wrapper */
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Alertas escaladas</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin alertas escaladas.</p>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <div
                key={a.id}
                className={cn('flex flex-wrap items-center gap-3 rounded-md border border-l-4 border-slate-200 p-3', SEVERITY_BAND[a.severity])}
              >
                <button
                  type="button"
                  onClick={() => router.push(`/patients/${a.patient.id}?tab=historial`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium hover:underline">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.patient.name} · abierta {a.hoursOpen} h
                    {a.assignedTo ? ` · ${a.assignedTo}` : ''}
                  </p>
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] sm:min-h-9"
                  disabled={busyId === a.id}
                  onClick={() => onResolve(a.id)}
                >
                  {busyId === a.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Resolver
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
