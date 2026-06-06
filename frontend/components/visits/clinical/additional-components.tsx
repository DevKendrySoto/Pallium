'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScaleApplication } from '@/components/visits/clinical/scale-application'
import { Choice, TextArea } from '@/components/visits/clinical/field-kit'
import type { CompProps } from '@/types/clinical'

// ============================================================================
//  SymptomChecklist — síntomas con intensidad (escala 0–N del config).
// ============================================================================
const SYMPTOMS: { key: string; label: string }[] = [
  { key: 'pain', label: 'Dolor' },
  { key: 'dyspnea', label: 'Disnea' },
  { key: 'nausea', label: 'Náusea' },
  { key: 'vomiting', label: 'Vómito' },
  { key: 'fatigue', label: 'Astenia / fatiga' },
  { key: 'anorexia', label: 'Anorexia' },
  { key: 'constipation', label: 'Estreñimiento' },
  { key: 'insomnia', label: 'Insomnio' },
  { key: 'anxiety', label: 'Ansiedad' },
  { key: 'depression', label: 'Tristeza / depresión' },
  { key: 'drowsiness', label: 'Somnolencia' },
]

export function SymptomChecklist({ config, value, onChange }: CompProps) {
  const scale = (config.scale as string) ?? '0-10'
  const max = Number(scale.split('-')[1]) || 10
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Intensidad de cada síntoma (0–{max}).</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SYMPTOMS.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-2">
            <Label className="text-sm">{s.label}</Label>
            <Input
              type="number"
              min={0}
              max={max}
              className="h-9 w-20"
              value={(value[s.key] as number | undefined) ?? ''}
              onChange={(e) =>
                onChange({ ...value, [s.key]: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Otros síntomas</Label>
        <TextArea
          value={(value.other as string) ?? ''}
          onChange={(e) => onChange({ ...value, other: e.target.value })}
        />
      </div>
    </div>
  )
}

// ============================================================================
//  ConsciousnessLevel — escala AVDI (Alerta / Voz / Dolor / Inconsciente).
// ============================================================================
const AVDI: { value: string; label: string }[] = [
  { value: 'A', label: 'Alerta' },
  { value: 'V', label: 'Responde a la voz' },
  { value: 'D', label: 'Responde al dolor' },
  { value: 'I', label: 'Inconsciente' },
]

export function ConsciousnessLevel({ value, onChange }: CompProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVDI.map((o) => (
        <Choice
          key={o.value}
          label={o.label}
          active={value.level === o.value}
          onClick={() => onChange({ ...value, level: o.value })}
        />
      ))}
    </div>
  )
}

// ============================================================================
//  FunctionalStatus — modo "scale": reaplica una escala funcional (p. ej. PPS).
// ============================================================================
export function FunctionalStatus({ config, value, onChange, ctx }: CompProps) {
  const mode = (config.mode as string) ?? 'scale'
  const scaleCode = config.scaleCode as string | undefined
  if (mode === 'scale' && scaleCode) {
    return (
      <ScaleApplication config={{ scales: [scaleCode] }} value={value} onChange={onChange} ctx={ctx} />
    )
  }
  return <p className="text-sm text-muted-foreground">Estado funcional no configurado.</p>
}

// ============================================================================
//  CaregiverStatus — presencia y (opcional) nivel de sobrecarga del cuidador.
// ============================================================================
const BURDEN: { value: string; label: string }[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'light', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'severe', label: 'Severa' },
]

export function CaregiverStatus({ config, value, onChange }: CompProps) {
  const assessBurden = Boolean(config.assessBurden)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">Cuidador presente</Label>
        <Choice
          label={value.present ? 'Sí' : 'No'}
          active={Boolean(value.present)}
          onClick={() => onChange({ ...value, present: !value.present })}
        />
      </div>
      {assessBurden && (
        <div className="space-y-1">
          <Label className="text-sm">Nivel de sobrecarga</Label>
          <div className="flex flex-wrap gap-2">
            {BURDEN.map((b) => (
              <Choice
                key={b.value}
                label={b.label}
                active={value.burden === b.value}
                onClick={() => onChange({ ...value, burden: b.value })}
              />
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-sm">Observaciones</Label>
        <TextArea
          value={(value.notes as string) ?? ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </div>
    </div>
  )
}

// ============================================================================
//  AdherenceAssessment — adherencia por dimensión (medicación, plan, dieta).
// ============================================================================
const DIMENSION_LABEL: Record<string, string> = {
  medication: 'Medicación',
  careplan: 'Plan de cuidados',
  diet: 'Dieta',
}
const ADHERENCE: { value: string; label: string }[] = [
  { value: 'good', label: 'Buena' },
  { value: 'partial', label: 'Parcial' },
  { value: 'poor', label: 'Mala' },
]

export function AdherenceAssessment({ config, value, onChange }: CompProps) {
  const dimensions = (config.dimensions as string[]) ?? []
  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <div key={dim} className="space-y-1">
          <Label className="text-sm">{DIMENSION_LABEL[dim] ?? dim}</Label>
          <div className="flex flex-wrap gap-2">
            {ADHERENCE.map((a) => (
              <Choice
                key={a.value}
                label={a.label}
                active={(value[dim] as string) === a.value}
                onClick={() => onChange({ ...value, [dim]: a.value })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
//  InterconsultRequest — solicita interconsulta a otras especialidades.
// ============================================================================
const ROLE_LABEL: Record<string, string> = {
  MEDICINE: 'Médico',
  NURSING: 'Enfermería',
  PSYCHOLOGY: 'Psicología',
  SOCIAL_WORK: 'Trabajo social',
  PHYSIOTHERAPY: 'Fisiatría',
}

export function InterconsultRequest({ config, value, onChange }: CompProps) {
  const targetRoles = (config.targetRoles as string[]) ?? []
  const selected = Array.isArray(value.roles) ? (value.roles as string[]) : []
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm">Solicitar interconsulta a</Label>
        <div className="flex flex-wrap gap-2">
          {targetRoles.map((role) => {
            const active = selected.includes(role)
            return (
              <Choice
                key={role}
                label={ROLE_LABEL[role] ?? role}
                active={active}
                onClick={() =>
                  onChange({
                    ...value,
                    roles: active ? selected.filter((r) => r !== role) : [...selected, role],
                  })
                }
              />
            )
          })}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="space-y-1">
          <Label className="text-sm">Motivo de la interconsulta</Label>
          <TextArea
            value={(value.reason as string) ?? ''}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
//  NextAppointmentScheduler — registra la próxima cita sugerida.
// ============================================================================
export function NextAppointmentScheduler({ config, value, onChange }: CompProps) {
  const suggestFromCadence = Boolean(config.suggestFromCadence)
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm">Próxima cita sugerida</Label>
        <Input
          type="datetime-local"
          value={(value.date as string) ?? ''}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
        {suggestFromCadence && (
          <p className="text-xs text-muted-foreground">
            Sugerencia según cadencia (cada 30 días). La cita se agenda formalmente desde Agenda.
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Notas</Label>
        <TextArea
          value={(value.notes as string) ?? ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </div>
    </div>
  )
}
