'use client'

import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { previewAlert, previewInterpretation, previewScore, type ScaleItems } from '@/lib/scale-schema'
import { cn } from '@/lib/utils'

interface Props {
  schema: Record<string, unknown>
  alertRule: Record<string, unknown> | null
}

/** Vista previa interactiva: renderiza la escala desde el schema y calcula puntaje/alerta en vivo. */
export function ScalePreview({ schema, alertRule }: Props) {
  const [items, setItems] = useState<ScaleItems>({})
  const type = schema.type as string

  // Reiniciamos las respuestas si cambia el tipo de escala.
  const typeKey = JSON.stringify({ type, items: schema.items, options: schema.options })
  const [boundType, setBoundType] = useState(typeKey)
  if (typeKey !== boundType) {
    setBoundType(typeKey)
    setItems({})
  }

  const score = useMemo(() => previewScore(schema, items), [schema, items])
  const interpretation = useMemo(() => previewInterpretation(schema, score), [schema, score])
  const alert = useMemo(() => previewAlert(alertRule, score, items), [alertRule, score, items])

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>

      {type === 'single-select' && <SingleSelect schema={schema} value={items.value as number | undefined} onChange={(v) => setItems({ value: v })} />}
      {type === 'sum' && <SumItems schema={schema} items={items} onChange={setItems} />}
      {type === 'multi-numeric' && <MultiNumeric schema={schema} items={items} onChange={setItems} />}
      {(type === 'transform' || type === 'classification') && (
        <p className="text-sm text-muted-foreground">
          El tipo <code className="font-mono">{type}</code> calcula su puntaje en el servidor; aquí solo se valida la estructura.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-sm">
        <span>Puntaje: <span className="font-semibold">{score ?? '—'}</span></span>
        {interpretation && <Badge variant="outline" className="border-slate-300">{interpretation}</Badge>}
        {alert && (
          <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5 text-danger">
            <AlertTriangle size={14} /> {alert.severity}: {alert.message}
          </span>
        )}
      </div>
    </div>
  )
}

function SingleSelect({ schema, value, onChange }: { schema: Record<string, unknown>; value?: number; onChange: (v: number) => void }) {
  const options = (schema.options as { value: number; label: string }[]) ?? []
  return (
    <div className="space-y-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm',
            value === o.value ? 'border-primary bg-primary/10' : 'border-slate-200 bg-background',
          )}
        >
          <span className="font-mono text-xs text-muted-foreground">{o.value}</span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function SumItems({ schema, items, onChange }: { schema: Record<string, unknown>; items: ScaleItems; onChange: (i: ScaleItems) => void }) {
  const rows = (schema.items as { key: string; label: string; options: number[] }[]) ?? []
  return (
    <div className="space-y-2">
      {rows.map((it) => (
        <div key={it.key} className="flex items-center justify-between gap-2">
          <span className="text-sm">{it.label}</span>
          <div className="flex gap-1">
            {it.options.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={items[it.key] === opt ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...items, [it.key]: opt })}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MultiNumeric({ schema, items, onChange }: { schema: Record<string, unknown>; items: ScaleItems; onChange: (i: ScaleItems) => void }) {
  const scale = (schema.scale as { min: number; max: number }) ?? { min: 0, max: 10 }
  const raw = (schema.items as (string | { key: string; label: string })[]) ?? []
  const rows = raw.map((it) => (typeof it === 'string' ? { key: it, label: it } : it))
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((it) => (
        <label key={it.key} className="flex items-center justify-between gap-2 text-sm capitalize">
          {it.label}
          <Input
            type="number"
            min={scale.min}
            max={scale.max}
            value={items[it.key] === undefined ? '' : String(items[it.key])}
            onChange={(e) => {
              const n = e.target.value === '' ? undefined : Number(e.target.value)
              const next = { ...items }
              if (n === undefined) delete next[it.key]
              else next[it.key] = n
              onChange(next)
            }}
            className="h-8 w-16"
          />
        </label>
      ))}
    </div>
  )
}
