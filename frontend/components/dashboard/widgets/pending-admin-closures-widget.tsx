'use client'

import { CheckCircle2, FileCheck2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useMarkAdminClosure } from '@/features/dashboard/hooks'
import { pendingAdminClosuresDataSchema, type PendingAdminClosureItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

const CHECKLIST = [
  { key: 'consents', label: 'Consentimientos validados' },
  { key: 'familyNotified', label: 'Familia notificada' },
  { key: 'alertsClosed', label: 'Alertas cerradas' },
  { key: 'bereavement', label: 'Duelo programado (opcional)' },
]

function daysBadge(days: number) {
  if (days > 15) return 'border-transparent bg-danger text-danger-foreground'
  if (days > 7) return 'border-transparent bg-amber-400 text-amber-950'
  return 'border-slate-200 text-slate-700'
}

export function PendingAdminClosuresWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const mark = useMarkAdminClosure()
  const [target, setTarget] = useState<PendingAdminClosureItem | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const parsed = pendingAdminClosuresDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { items, total } = parsed.data

  async function confirm() {
    if (!target) return
    const notes = CHECKLIST.filter((c) => checked[c.key]).map((c) => c.label).join('; ')
    try {
      await mark.mutateAsync({ patientId: target.patient.id, notes: notes || undefined })
      toast.success('Cierre administrativo registrado')
      setTarget(null)
      setChecked({})
    } catch {
      /* el wrapper de API ya muestra el error */
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Cierres administrativos pendientes</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay cierres pendientes.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.patient.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
                <button type="button" onClick={() => router.push(`/patients/${it.patient.id}`)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium hover:underline">{it.patient.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    Deceso {it.deceasedAt ? it.deceasedAt.slice(0, 10) : '—'}
                    {it.deceasedBy ? ` · ${it.deceasedBy}` : ''}
                    {it.hasClinicalClosure ? ' · cierre clínico ✓' : ' · sin cierre clínico'}
                  </p>
                </button>
                <Badge variant="outline" className={cn('font-medium', daysBadge(it.daysPending))}>
                  {it.daysPending} d
                </Badge>
                <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-9" onClick={() => setTarget(it)}>
                  <FileCheck2 size={16} /> Marcar revisado
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cierre administrativo</DialogTitle>
            <DialogDescription>{target?.patient.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {CHECKLIST.map((c) => (
              <label key={c.key} className="flex min-h-[44px] items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(checked[c.key])}
                  onChange={(e) => setChecked({ ...checked, [c.key]: e.target.checked })}
                />
                <Label className="cursor-pointer">{c.label}</Label>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button disabled={mark.isPending} onClick={confirm}>
              {mark.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirmar cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
