'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CompProps } from '@/types/clinical'

interface Wound {
  location: string
  type: string
  stage: string
  lengthCm?: number
  widthCm?: number
  status: 'new' | 'improving' | 'stable' | 'worsening' | 'healed'
  careDone?: string
}

const STATUSES: { value: Wound['status']; label: string }[] = [
  { value: 'new', label: 'Nueva' },
  { value: 'improving', label: 'Mejora' },
  { value: 'stable', label: 'Estable' },
  { value: 'worsening', label: 'Empeora' },
  { value: 'healed', label: 'Cicatrizada' },
]

export function WoundTracker({ value, onChange }: CompProps) {
  const wounds = (value.wounds as Wound[]) ?? []

  const update = (next: Wound[]) => onChange({ ...value, wounds: next })
  const setAt = (i: number, patch: Partial<Wound>) =>
    update(wounds.map((w, idx) => (idx === i ? { ...w, ...patch } : w)))

  return (
    <div className="space-y-3">
      {wounds.map((w, i) => (
        <div key={i} className="space-y-3 rounded-md border border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Localización</Label>
              <Input value={w.location} onChange={(e) => setAt(i, { location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Input value={w.type} onChange={(e) => setAt(i, { type: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estadio</Label>
              <Input value={w.stage} onChange={(e) => setAt(i, { stage: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Largo (cm)</Label>
              <Input
                type="number"
                value={w.lengthCm ?? ''}
                onChange={(e) => setAt(i, { lengthCm: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ancho (cm)</Label>
              <Input
                type="number"
                value={w.widthCm ?? ''}
                onChange={(e) => setAt(i, { widthCm: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setAt(i, { status: s.value })}
                className={cn(
                  'min-h-9 rounded-md border px-3 text-sm',
                  w.status === s.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-700',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Curación realizada</Label>
            <Input value={w.careDone ?? ''} onChange={(e) => setAt(i, { careDone: e.target.value })} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger"
            onClick={() => update(wounds.filter((_, idx) => idx !== i))}
          >
            <Trash2 size={16} /> Quitar herida
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update([...wounds, { location: '', type: '', stage: '', status: 'new' }])
        }
      >
        <Plus size={16} /> Agregar herida
      </Button>
    </div>
  )
}
