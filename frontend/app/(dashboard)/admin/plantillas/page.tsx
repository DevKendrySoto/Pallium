'use client'

import { Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DynamicForm } from '@/components/visits/clinical/dynamic-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCategories } from '@/features/catalogs'
import {
  type ClinicalTemplateAdmin,
  SPECIALTY_LABELS,
  type Specialty,
  useAllTemplates,
  useCreateTemplate,
  useUpdateTemplate,
} from '@/features/templates-admin'
import { COMPONENT_TYPES, validateTemplateSections } from '@/lib/template-schema'
import { cn } from '@/lib/utils'
import type { TemplateSection } from '@/types/clinical'

const SPECIALTIES = Object.keys(SPECIALTY_LABELS) as Specialty[]
const STARTER = JSON.stringify(
  [
    {
      key: 'evaluacion',
      title: 'Evaluación',
      components: [
        { type: 'VitalSignsBlock', key: 'vitales', config: {} },
        { type: 'RecommendationsList', key: 'recomendaciones', config: {} },
      ],
    },
  ],
  null,
  2,
)

function specialtyLabel(s: Specialty | null) {
  return s ? SPECIALTY_LABELS[s] : 'General'
}

export default function TemplatesAdminPage() {
  const { data, isLoading, isError } = useAllTemplates()
  const [filter, setFilter] = useState<Specialty | 'all'>('all')
  const [editing, setEditing] = useState<ClinicalTemplateAdmin | null>(null)
  const [creating, setCreating] = useState(false)
  const update = useUpdateTemplate()

  const filtered = (data ?? []).filter((t) => filter === 'all' || t.specialty === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plantillas clínicas</h1>
          <p className="text-sm text-muted-foreground">Estructura del registro clínico dinámico por rol y categoría de paciente.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={18} /> Nueva plantilla</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter('all')}
          className={cn('min-h-8 rounded-md border px-2.5 text-xs', filter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
          Todas
        </button>
        {SPECIALTIES.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            className={cn('min-h-8 rounded-md border px-2.5 text-xs', filter === s ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
            {SPECIALTY_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Versión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {isError && <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-danger">No se pudieron cargar las plantillas.</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Ninguna plantilla para este filtro.</TableCell></TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.key}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{specialtyLabel(t.specialty)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.categoryCode || 'Todas'}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">v{t.version}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('font-medium', t.isActive ? 'border-transparent bg-success text-success-foreground' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                    {t.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(t)}>Editar</Button>
                    <Button variant="outline" size="sm" disabled={update.isPending}
                      onClick={() => update.mutate({ key: t.key, isActive: !t.isActive })}>
                      {t.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {creating && <TemplateEditor onClose={() => setCreating(false)} />}
      {editing && <TemplateEditor template={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TemplateEditor({ template, onClose }: { template?: ClinicalTemplateAdmin; onClose: () => void }) {
  const isEdit = Boolean(template)
  const create = useCreateTemplate()
  const update = useUpdateTemplate()
  const categories = useCategories()

  const [key, setKey] = useState(template?.key ?? '')
  const [name, setName] = useState(template?.name ?? '')
  const [specialty, setSpecialty] = useState<Specialty | ''>(template?.specialty ?? '')
  const [categoryCode, setCategoryCode] = useState(template?.categoryCode ?? '')
  const [sectionsText, setSectionsText] = useState(template ? JSON.stringify(template.sections, null, 2) : STARTER)

  const parsed = useMemo(() => {
    let sections: TemplateSection[] | null = null
    const errors: string[] = []
    try {
      sections = JSON.parse(sectionsText)
    } catch {
      errors.push('El JSON de sections no es válido.')
    }
    if (sections) errors.push(...validateTemplateSections(sections))
    return { sections, errors }
  }, [sectionsText])

  const keyValid = isEdit || /^[a-z0-9_]{3,60}$/.test(key)
  const valid = name.trim().length >= 3 && keyValid && parsed.errors.length === 0 && parsed.sections !== null
  const pending = create.isPending || update.isPending

  function submit() {
    if (!valid || !parsed.sections) return
    const done = { onSuccess: () => onClose() }
    const common = { name: name.trim(), specialty: specialty || null, categoryCode: categoryCode || null, sections: parsed.sections }
    if (isEdit && template) update.mutate({ key: template.key, ...common }, done)
    else create.mutate({ key: key.trim().toLowerCase(), ...common }, done)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar plantilla · ${template!.key} (v${template!.version})` : 'Nueva plantilla'}</DialogTitle>
          <DialogDescription>Editar la estructura sube la versión. Verifica el render en la vista previa antes de guardar.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Clave</Label>
                <Input value={key} disabled={isEdit} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="medical_adult_palliative" />
              </div>
              <div className="space-y-1">
                <Label>Especialidad</Label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value as Specialty | '')} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
                  <option value="">General (sin especialidad)</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Categoría de paciente</Label>
              <select value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
                <option value="">Todas las categorías</option>
                {(categories.data ?? []).map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Secciones (JSON)</Label>
              <textarea value={sectionsText} onChange={(e) => setSectionsText(e.target.value)} rows={16}
                className="w-full rounded-md border border-slate-200 p-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <p className="text-xs text-muted-foreground">Componentes: {COMPONENT_TYPES.join(', ')}.</p>
            </div>
            {parsed.errors.length > 0 && (
              <ul className="space-y-1 rounded-md border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
                {parsed.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>
            {parsed.sections && parsed.errors.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <DynamicForm sections={parsed.sections} value={{}} onChange={() => {}} disabled ctx={{ patientId: 'preview', visitId: 'preview' }} />
              </div>
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
            {pending && <Loader2 size={18} className="animate-spin" />} {isEdit ? 'Guardar' : 'Crear plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
