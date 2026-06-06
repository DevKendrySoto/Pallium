'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  AdherenceAssessment,
  CaregiverStatus,
  ConsciousnessLevel,
  FunctionalStatus,
  InterconsultRequest,
  NextAppointmentScheduler,
  SymptomChecklist,
} from '@/components/visits/clinical/additional-components'
import { MedicationDelta } from '@/components/visits/clinical/medication-delta'
import { PhotoAttachment } from '@/components/visits/clinical/photo-attachment'
import { ScaleApplication } from '@/components/visits/clinical/scale-application'
import { WoundTracker } from '@/components/visits/clinical/wound-tracker'
import type {
  ClinicalCtx,
  ClinicalRecordSections,
  CompProps,
  TemplateComponent,
  TemplateField,
  TemplateSection,
} from '@/types/clinical'

type Value = Record<string, unknown>

/** Botón tipo chip/radio (evita selects para pocas opciones). */
function Choice({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-9 rounded-md border px-3 text-sm',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TemplateField
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className="min-h-20 w-full rounded-md border border-slate-200 p-2 text-base"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (field.type === 'radio') {
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <Choice key={opt} label={opt} active={value === opt} onClick={() => onChange(opt)} />
        ))}
      </div>
    )
  }
  if (field.type === 'chips') {
    const arr = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => {
          const active = arr.includes(opt)
          return (
            <Choice
              key={opt}
              label={opt}
              active={active}
              onClick={() => onChange(active ? arr.filter((x) => x !== opt) : [...arr, opt])}
            />
          )
        })}
      </div>
    )
  }
  if (field.type === 'switch') {
    return (
      <Choice
        label={value ? 'Sí' : 'No'}
        active={Boolean(value)}
        onClick={() => onChange(!value)}
      />
    )
  }
  return (
    <Input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={(value as string | number) ?? ''}
      onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  )
}

function FieldsGroup({ config, value, onChange }: CompProps) {
  const fields = (config.fields as TemplateField[]) ?? []
  const cols = (config.columns as number) ?? 1
  return (
    <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3')}>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-sm">{f.label}</Label>
          <FieldInput field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
        </div>
      ))}
    </div>
  )
}

const VITALS: { key: string; label: string; unit?: string }[] = [
  { key: 'systolicBp', label: 'TA sistólica', unit: 'mmHg' },
  { key: 'diastolicBp', label: 'TA diastólica', unit: 'mmHg' },
  { key: 'heartRate', label: 'FC', unit: 'lpm' },
  { key: 'respiratoryRate', label: 'FR', unit: 'rpm' },
  { key: 'temperatureC', label: 'Temp.', unit: '°C' },
  { key: 'spo2', label: 'SpO₂', unit: '%' },
  { key: 'painScore', label: 'Dolor', unit: '0-10' },
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'heightCm', label: 'Talla', unit: 'cm' },
]

function VitalSignsBlock({ value, onChange }: CompProps) {
  const w = Number(value.weightKg)
  const h = Number(value.heightCm)
  const bmi = w && h ? Math.round((w / (h / 100) ** 2) * 10) / 10 : null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {VITALS.map((v) => (
          <div key={v.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {v.label} {v.unit ? `(${v.unit})` : ''}
            </Label>
            <Input
              type="number"
              value={(value[v.key] as number) ?? ''}
              onChange={(e) =>
                onChange({ ...value, [v.key]: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
        ))}
      </div>
      {bmi !== null && <p className="text-sm text-muted-foreground">IMC calculado: <span className="font-medium text-foreground">{bmi}</span></p>}
    </div>
  )
}

function RecommendationsList({ value, onChange }: CompProps) {
  return (
    <textarea
      className="min-h-20 w-full rounded-md border border-slate-200 p-2 text-base"
      placeholder="Indicaciones y recomendaciones…"
      value={(value.freeText as string) ?? ''}
      onChange={(e) => onChange({ ...value, freeText: e.target.value })}
    />
  )
}

const RENDERERS: Record<string, React.ComponentType<CompProps>> = {
  FieldsGroup,
  VitalSignsBlock,
  ScaleApplication,
  RecommendationsList,
  WoundTracker,
  MedicationDelta,
  PhotoAttachment,
  SymptomChecklist,
  ConsciousnessLevel,
  FunctionalStatus,
  CaregiverStatus,
  AdherenceAssessment,
  InterconsultRequest,
  NextAppointmentScheduler,
}

function ComponentRenderer({
  component,
  value,
  onChange,
  ctx,
}: {
  component: TemplateComponent
  value: Value
  onChange: (next: Value) => void
  ctx?: ClinicalCtx
}) {
  const Impl = RENDERERS[component.type]
  if (!Impl) {
    return (
      <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">
        Componente <span className="font-mono">{component.type}</span> aún no disponible en esta
        fase.
      </p>
    )
  }
  return <Impl config={component.config} value={value} onChange={onChange} ctx={ctx} />
}

export function DynamicForm({
  sections,
  value,
  onChange,
  ctx,
  disabled,
}: {
  sections: TemplateSection[]
  value: ClinicalRecordSections
  onChange: (next: ClinicalRecordSections) => void
  ctx?: ClinicalCtx
  disabled?: boolean
}) {
  function update(sectionKey: string, componentKey: string, next: Value) {
    onChange({
      ...value,
      [sectionKey]: { ...(value[sectionKey] ?? {}), [componentKey]: next },
    })
  }

  return (
    <div className={cn('space-y-4', disabled && 'pointer-events-none opacity-60')}>
      {sections.map((section) => (
        <Card key={section.key} className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {section.components.map((c) => (
              <ComponentRenderer
                key={c.key}
                component={c}
                value={(value[section.key]?.[c.key] as Value) ?? {}}
                onChange={(next) => update(section.key, c.key, next)}
                ctx={ctx}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
