'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Indicador sutil de frescura. Advierte en rojo si pasan >120s sin refresh. */
export function LastUpdated({ updatedAt, fetching }: { updatedAt: number; fetching: boolean }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!updatedAt) return null
  const seconds = Math.max(0, Math.round((Date.now() - updatedAt) / 1000))
  const stale = seconds > 120
  const label = seconds < 60 ? `hace ${seconds}s` : `hace ${Math.round(seconds / 60)} min`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        stale ? 'text-danger' : 'text-muted-foreground',
      )}
      title={stale ? 'Los datos podrían estar desactualizados' : 'Actualización automática cada 60s'}
    >
      <RefreshCw size={12} className={cn(fetching && 'animate-spin')} />
      {fetching ? 'actualizando…' : `actualizado ${label}`}
    </span>
  )
}
