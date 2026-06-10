'use client'

import { Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ScalePreview } from '@/components/admin/scales/scale-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  SCALE_CATEGORY_LABELS,
  type ScaleAdmin,
  type ScaleCategory,
  useAllScales,
  useCreateScale,
  useUpdateScale,
} from '@/features/scales-admin'
import { validateScaleSchema } from '@/lib/scale-schema'
import { cn } from '@/lib/utils'

const CATEGORIES = Object.keys(SCALE_CATEGORY_LABELS) as ScaleCategory[]
const STARTER_SCHEMA = JSON.stringify(
  { type: 'single-select', options: [{ value: 0, label: '' }], interpretationBands: [] },
  null,
  2,
)

export default function ScalesAdminPage() {
  const { data, isLoading, isError } = useAllScales()
  const [filter, setFilter] = useState<ScaleCategory | 'all'>('all')
  const [editing, setEditing] = useState<ScaleAdmin | null>(null)
  const [creating, setCreating] = useState(false)
  const update = useUpdateScale()

  const filtered = (data ?? []).filter((s) => filter === 'all' || s.category === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Escalas</h1>
          <p className="text-sm text-muted-foreground">Catálogo de escalas de valoración: ítems, puntajes y reglas de alerta.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={18} /> Nueva escala</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter('all')}
          className={cn('min-h-8 rounded-md border px-2.5 text-xs', filter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setFilter(c)}
            className={cn('min-h-8 rounded-md border px-2.5 text-xs', filter === c ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
            {SCALE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valoraciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {isError && <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-danger">No se pudieron cargar las escalas.</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Ninguna escala en esta categoría.</TableCell></TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.code}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{SCALE_CATEGORY_LABELS[s.category]}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{String(s.schema?.type ?? '—')}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{s._count.assessments}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('font-medium', s.isActive ? 'border-transparent bg-success text-success-foreground' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                    {s.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(s)}>Editar</Button>
                    <Button variant="outline" size="sm" disabled={update.isPending}
                      onClick={() => update.mutate({ code: s.code, isActive: !s.isActive })}>
                      {s.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {creating && <ScaleEditor onClose={() => setCreating(false)} />}
      {editing && <ScaleEditor scale={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ScaleEditor({ scale, onClose }: { scale?: ScaleAdmin; onClose: () => void }) {
  const isEdit = Boolean(scale)
  const create = useCreateScale()
  const update = useUpdateScale()

  const [code, setCode] = useState(scale?.code ?? '')
  const [name, setName] = useState(scale?.name ?? '')
  const [category, setCategory] = useState<ScaleCategory>(scale?.category ?? 'FUNCTIONAL')
  const [description, setDescription] = useState(scale?.description ?? '')
  const [schemaText, setSchemaText] = useState(scale ? JSON.stringify(scale.schema, null, 2) : STARTER_SCHEMA)
  const [alertText, setAlertText] = useState(scale?.alertRule ? JSON.stringify(scale.alertRule, null, 2) : '')

  const parsed = useMemo(() => {
    let schema: Record<string, unknown> | null = null
    let alertRule: Record<string, unknown> | null = null
    const errors: string[] = []
    try {
      schema = JSON.parse(schemaText)
    } catch {
      errors.push('El JSON del schema no es válido.')
    }
    if (alertText.trim()) {
      try {
        alertRule = JSON.parse(alertText)
      } catch {
        errors.push('El JSON del alertRule no es válido.')
      }
    }
    if (schema) errors.push(...validateScaleSchema(schema, alertRule))
    return { schema, alertRule, errors }
  }, [schemaText, alertText])

  const codeValid = isEdit || /^[A-Z0-9_]{2,40}$/.test(code)
  const valid = name.trim().length >= 3 && codeValid && parsed.errors.length === 0 && parsed.schema !== null
  const pending = create.isPending || update.isPending

  function submit() {
    if (!valid || !parsed.schema) return
    const done = { onSuccess: () => onClose() }
    if (isEdit && scale) {
      update.mutate({ code: scale.code, name: name.trim(), category, description: description.trim() || undefined, schema: parsed.schema, alertRule: parsed.alertRule }, done)
    } else {
      create.mutate({ code: code.trim().toUpperCase(), name: name.trim(), category, description: description.trim() || undefined, schema: parsed.schema, alertRule: parsed.alertRule }, done)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar escala · ${scale!.code}` : 'Nueva escala'}</DialogTitle>
          <DialogDescription>Define la estructura (JSON) y verifica el comportamiento en la vista previa antes de guardar.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código</Label>
                <Input value={code} disabled={isEdit} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KARNOFSKY" />
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value as ScaleCategory)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{SCALE_CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Descripción <span className="text-muted-foreground">(opcional)</span></Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Schema (JSON)</Label>
              <textarea value={schemaText} onChange={(e) => setSchemaText(e.target.value)} rows={12}
                className="w-full rounded-md border border-slate-200 p-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1">
              <Label>alertRule (JSON, opcional)</Label>
              <textarea value={alertText} onChange={(e) => setAlertText(e.target.value)} rows={4} placeholder='{ "max": 40, "severity": "HIGH", "message": "..." }'
                className="w-full rounded-md border border-slate-200 p-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            {parsed.errors.length > 0 && (
              <ul className="space-y-1 rounded-md border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
                {parsed.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>

          <div>
            {parsed.schema && parsed.errors.length === 0 ? (
              <ScalePreview schema={parsed.schema} alertRule={parsed.alertRule} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
                Corrige el JSON para ver la vista previa.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!valid || pending} onClick={submit}>
            {pending && <Loader2 size={18} className="animate-spin" />} {isEdit ? 'Guardar' : 'Crear escala'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
