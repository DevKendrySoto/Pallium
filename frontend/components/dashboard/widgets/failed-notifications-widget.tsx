'use client'

import { ChevronDown, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDiscardNotification, useRetryNotification } from '@/features/dashboard/hooks'
import { failedNotificationsDataSchema } from '@/features/dashboard/types'

export function FailedNotificationsWidget({ data }: { data: unknown }) {
  const retry = useRetryNotification()
  const discard = useDiscardNotification()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const parsed = failedNotificationsDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { items, total } = parsed.data

  async function run(id: string, action: 'retry' | 'discard') {
    setBusyId(id)
    try {
      if (action === 'retry') {
        await retry.mutateAsync({ id })
        toast.success('Reintento enviado')
      } else {
        await discard.mutateAsync({ id })
        toast.success('Notificación descartada')
      }
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
          <h2 className="text-lg font-semibold tracking-tight">Notificaciones fallidas</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin notificaciones fallidas.</p>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div key={n.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => setExpanded(expanded === n.id ? null : n.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">
                      {n.routeName ?? 'Ruta'} · {n.channel}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      {n.recipient} · {n.lastError ? n.lastError.slice(0, 50) : 'error'}
                      <ChevronDown size={12} />
                    </p>
                  </button>
                  <Button size="sm" className="min-h-[44px] sm:min-h-9" disabled={busyId === n.id} onClick={() => run(n.id, 'retry')}>
                    {busyId === n.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Reintentar
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-9 text-danger" disabled={busyId === n.id} onClick={() => run(n.id, 'discard')}>
                    <Trash2 size={16} /> Descartar
                  </Button>
                </div>
                {expanded === n.id && n.lastError && (
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">{n.lastError}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
