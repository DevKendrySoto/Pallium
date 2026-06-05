'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CompProps } from '@/types/clinical'

type Action = 'add' | 'adjust' | 'suspend'
interface MedChange {
  action: Action
  drug: string
  dose?: string
  frequency?: string
  reason?: string
}

const ACTION_LABELS: Record<Action, string> = {
  add: 'Iniciar',
  adjust: 'Ajustar',
  suspend: 'Suspender',
}

export function MedicationDelta({ config, value, onChange }: CompProps) {
  const allowed = ((config.allowActions as Action[]) ?? ['add', 'adjust', 'suspend']) as Action[]
  const changes = (value.changes as MedChange[]) ?? []

  const update = (next: MedChange[]) => onChange({ ...value, changes: next })
  const setAt = (i: number, patch: Partial<MedChange>) =>
    update(changes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Registra solo los cambios de medicación (la lista activa vive en el perfil).
      </p>
      {changes.map((c, i) => (
        <div key={i} className="space-y-3 rounded-md border border-slate-200 p-3">
          <div className="flex flex-wrap gap-2">
            {allowed.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAt(i, { action: a })}
                className={cn(
                  'min-h-9 rounded-md border px-3 text-sm',
                  c.action === a
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-700',
                )}
              >
                {ACTION_LABELS[a]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fármaco</Label>
              <Input value={c.drug} onChange={(e) => setAt(i, { drug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dosis</Label>
              <Input value={c.dose ?? ''} onChange={(e) => setAt(i, { dose: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Frecuencia</Label>
              <Input value={c.frequency ?? ''} onChange={(e) => setAt(i, { frequency: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Motivo</Label>
              <Input value={c.reason ?? ''} onChange={(e) => setAt(i, { reason: e.target.value })} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger"
            onClick={() => update(changes.filter((_, idx) => idx !== i))}
          >
            <Trash2 size={16} /> Quitar
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => update([...changes, { action: allowed[0], drug: '' }])}
      >
        <Plus size={16} /> Agregar cambio
      </Button>
    </div>
  )
}
