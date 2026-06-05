'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAssessScale, useScaleDefinition } from '@/features/scales'
import type { CompProps, ScaleDefinition } from '@/types/clinical'

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-9 rounded-md border px-3 text-sm',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700',
      )}
    >
      {label}
    </button>
  )
}

type Items = Record<string, number>

function normalizeOption(o: number | { label: string; value: number }) {
  return typeof o === 'number' ? { label: String(o), value: o } : o
}

/** Renderiza los ítems de UNA escala según su tipo y permite aplicarla. */
function ScaleItem({
  code,
  ctx,
  saved,
  onApplied,
}: {
  code: string
  ctx: { patientId: string; visitId: string }
  saved?: { score: number | null; interpretation: string | null }
  onApplied: (result: { items: Items; score: number | null; interpretation: string | null; assessmentId: string }) => void
}) {
  const { data: def, isLoading } = useScaleDefinition(code)
  const assess = useAssessScale()
  const [items, setItems] = useState<Items>({})

  if (isLoading || !def) {
    return <p className="text-sm text-muted-foreground">Cargando {code}…</p>
  }

  const schema = def.schema as ScaleDefinition['schema']
  const set = (k: string, v: number) => setItems((prev) => ({ ...prev, [k]: v }))

  function apply() {
    assess.mutate(
      { patientId: ctx.patientId, scaleCode: code, visitId: ctx.visitId, items },
      {
        onSuccess: (r) =>
          onApplied({
            items,
            score: r.assessment.score,
            interpretation: r.assessment.interpretation,
            assessmentId: r.assessment.id,
          }),
      },
    )
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{def.name}</Label>
        {saved && (
          <span className="text-sm text-muted-foreground">
            {saved.score !== null ? saved.score : '—'}
            {saved.interpretation ? ` · ${saved.interpretation}` : ''}
          </span>
        )}
      </div>

      {schema.type === 'single-select' && (
        <div className="flex flex-wrap gap-2">
          {(schema.options ?? []).map((o) => (
            <Choice key={o.value} label={o.label} active={items.value === o.value} onClick={() => set('value', o.value)} />
          ))}
        </div>
      )}

      {schema.type === 'sum' &&
        Array.isArray(schema.items) &&
        schema.items.map((it) => (
          <div key={it.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{it.label}</Label>
            <div className="flex flex-wrap gap-2">
              {it.options.map((raw) => {
                const o = normalizeOption(raw)
                return (
                  <Choice key={o.value} label={o.label} active={items[it.key] === o.value} onClick={() => set(it.key, o.value)} />
                )
              })}
            </div>
          </div>
        ))}

      {schema.type === 'multi-numeric' && Array.isArray(schema.items) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(schema.items as unknown as string[]).map((sym) => (
            <div key={sym} className="space-y-1">
              <Label className="text-xs capitalize text-muted-foreground">{sym}</Label>
              <input
                type="number"
                min={schema.scale?.min ?? 0}
                max={schema.scale?.max ?? 10}
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-base"
                value={items[sym] ?? ''}
                onChange={(e) => set(sym, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      )}

      <Button size="sm" variant="outline" onClick={apply} disabled={assess.isPending}>
        {assess.isPending && <Loader2 size={16} className="animate-spin" />}
        Aplicar
      </Button>
    </div>
  )
}

export function ScaleApplication({ config, value, onChange, ctx }: CompProps) {
  const scales = (config.scales as string[]) ?? []
  if (!ctx) return <p className="text-sm text-muted-foreground">Escalas no disponibles fuera de una visita.</p>
  return (
    <div className="space-y-3">
      {scales.map((code) => (
        <ScaleItem
          key={code}
          code={code}
          ctx={ctx}
          saved={value[code] as { score: number | null; interpretation: string | null } | undefined}
          onApplied={(result) => onChange({ ...value, [code]: result })}
        />
      ))}
    </div>
  )
}
