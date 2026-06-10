'use client'

import { Loader2, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserSession } from '@/types/user'

function deviceOf(ua: string | null): string {
  if (!ua) return 'Dispositivo desconocido'
  if (/mobile/i.test(ua)) return 'Móvil'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return ua.slice(0, 30)
}

export function SessionList({
  sessions,
  onRevoke,
  onRevokeAll,
  busy,
}: {
  sessions: UserSession[]
  onRevoke: (id: string) => void
  onRevokeAll?: () => void
  busy?: boolean
}) {
  const active = sessions.filter((s) => s.active)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{active.length} sesiones activas</p>
        {onRevokeAll && active.length > 0 && (
          <Button variant="outline" size="sm" disabled={busy} onClick={onRevokeAll}>
            Revocar todas
          </Button>
        )}
      </div>
      {sessions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin sesiones.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 p-3">
              <Monitor size={18} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{deviceOf(s.userAgent)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.ip ?? 'IP desconocida'} · creada {new Date(s.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              {s.active ? (
                <>
                  <Badge variant="outline" className="border-success text-success">Activa</Badge>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => onRevoke(s.id)}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : 'Revocar'}
                  </Button>
                </>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Revocada</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
