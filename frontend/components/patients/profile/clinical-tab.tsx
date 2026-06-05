'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ALLERGY_SEVERITY_LABELS,
  ALLERGY_TYPE_LABELS,
  HABIT_STATUS_LABELS,
  HABIT_TYPE_LABELS,
  HISTORY_CATEGORY_LABELS,
} from '@/features/profile/constants'
import {
  useAllergies,
  useCreateAllergy,
  useCreateHistory,
  useDeleteAllergy,
  useDeleteHistory,
  useDirective,
  useHabits,
  useHistory,
  useUpsertDirective,
  useUpsertHabit,
} from '@/features/profile/hooks'
import { useReadOnly } from '@/hooks/use-read-only'
import { cn } from '@/lib/utils'
import type {
  AllergySeverity,
  AllergyType,
  HabitStatus,
  HabitType,
  HistoryCategory,
} from '@/types/profile'

function Chip<T extends string>({
  value,
  selected,
  onClick,
  label,
}: {
  value: T
  selected: boolean
  onClick: (v: T) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'min-h-9 rounded-md border px-3 text-sm',
        selected ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700',
      )}
    >
      {label}
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

function AllergiesEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useAllergies(patientId)
  const create = useCreateAllergy(patientId)
  const del = useDeleteAllergy(patientId)
  const [substance, setSubstance] = useState('')
  const [type, setType] = useState<AllergyType>('MEDICATION')
  const [severity, setSeverity] = useState<AllergySeverity>('MODERATE')

  function add() {
    if (!substance.trim()) return
    create.mutate(
      { substance, type, severity },
      { onSuccess: () => setSubstance('') },
    )
  }

  return (
    <SectionCard title="Alergias">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Sin alergias registradas.</p>}
      {data?.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
          <div className="text-sm">
            <span className="font-medium">{a.substance}</span>{' '}
            <Badge variant="outline" className="border-danger/40 text-danger">
              {ALLERGY_SEVERITY_LABELS[a.severity]}
            </Badge>{' '}
            <span className="text-muted-foreground">
              {ALLERGY_TYPE_LABELS[a.type]}
              {a.reaction ? ` · ${a.reaction}` : ''}
            </span>
          </div>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => del.mutate(a.id)}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="space-y-2 rounded-md border border-dashed border-slate-200 p-3">
          <Input placeholder="Sustancia" value={substance} onChange={(e) => setSubstance(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ALLERGY_TYPE_LABELS) as AllergyType[]).map((t) => (
              <Chip key={t} value={t} selected={type === t} onClick={setType} label={ALLERGY_TYPE_LABELS[t]} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ALLERGY_SEVERITY_LABELS) as AllergySeverity[]).map((s) => (
              <Chip key={s} value={s} selected={severity === s} onClick={setSeverity} label={ALLERGY_SEVERITY_LABELS[s]} />
            ))}
          </div>
          <Button size="sm" onClick={add} disabled={create.isPending || !substance.trim()}>
            {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Agregar alergia
          </Button>
        </div>
      )}
    </SectionCard>
  )
}

function HistoryEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useHistory(patientId)
  const create = useCreateHistory(patientId)
  const del = useDeleteHistory(patientId)
  const [category, setCategory] = useState<HistoryCategory>('PERSONAL')
  const [description, setDescription] = useState('')

  function add() {
    if (!description.trim()) return
    create.mutate({ category, description }, { onSuccess: () => setDescription('') })
  }

  return (
    <SectionCard title="Antecedentes">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Sin antecedentes.</p>}
      {data?.map((h) => (
        <div key={h.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
          <div className="text-sm">
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              {HISTORY_CATEGORY_LABELS[h.category]}
            </Badge>{' '}
            {h.description}
          </div>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => del.mutate(h.id)}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="space-y-2 rounded-md border border-dashed border-slate-200 p-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(HISTORY_CATEGORY_LABELS) as HistoryCategory[]).map((c) => (
              <Chip key={c} value={c} selected={category === c} onClick={setCategory} label={HISTORY_CATEGORY_LABELS[c]} />
            ))}
          </div>
          <Input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button size="sm" onClick={add} disabled={create.isPending || !description.trim()}>
            <Plus size={16} /> Agregar antecedente
          </Button>
        </div>
      )}
    </SectionCard>
  )
}

const HABIT_TYPES = Object.keys(HABIT_TYPE_LABELS) as HabitType[]

function HabitsEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useHabits(patientId)
  const upsert = useUpsertHabit(patientId)
  const byType = new Map((data ?? []).map((h) => [h.type, h]))

  return (
    <SectionCard title="Hábitos tóxicos">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {HABIT_TYPES.map((t) => {
        const current = byType.get(t)?.status ?? 'NEVER'
        return (
          <div key={t} className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-sm">{HABIT_TYPE_LABELS[t]}</span>
            {(Object.keys(HABIT_STATUS_LABELS) as HabitStatus[]).map((s) => (
              <Chip
                key={s}
                value={s}
                selected={current === s}
                onClick={() => !readOnly && upsert.mutate({ type: t, status: s })}
                label={HABIT_STATUS_LABELS[s]}
              />
            ))}
          </div>
        )
      })}
    </SectionCard>
  )
}

function DirectiveEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useDirective(patientId)
  const upsert = useUpsertDirective(patientId)
  const signed = Boolean(data?.signedAt)
  const locked = readOnly || signed

  const [dnr, setDnr] = useState<boolean | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const effectiveDnr = dnr ?? data?.dnr ?? false
  const effectivePlace = place ?? data?.preferredPlaceOfCare ?? ''

  return (
    <SectionCard title="Voluntades anticipadas">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {signed && (
        <p className="text-sm text-success">Firmadas el {data!.signedAt!.slice(0, 10)} (inmutables).</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm">DNR (no reanimar)</span>
        <Chip value="yes" selected={effectiveDnr} onClick={() => !locked && setDnr(true)} label="Sí" />
        <Chip value="no" selected={!effectiveDnr} onClick={() => !locked && setDnr(false)} label="No" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Lugar de cuidado preferido</Label>
        <Input value={effectivePlace} disabled={locked} onChange={(e) => setPlace(e.target.value)} />
      </div>
      {!locked && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => upsert.mutate({ dnr: effectiveDnr, preferredPlaceOfCare: effectivePlace })}
            disabled={upsert.isPending}
          >
            Guardar
          </Button>
          <Button
            size="sm"
            onClick={() => upsert.mutate({ dnr: effectiveDnr, preferredPlaceOfCare: effectivePlace, sign: true })}
            disabled={upsert.isPending}
          >
            Guardar y firmar
          </Button>
        </div>
      )}
    </SectionCard>
  )
}

export function ClinicalTab({ patientId }: { patientId: string }) {
  const readOnly = useReadOnly()
  return (
    <div className="space-y-4">
      <AllergiesEditor patientId={patientId} readOnly={readOnly} />
      <HistoryEditor patientId={patientId} readOnly={readOnly} />
      <HabitsEditor patientId={patientId} readOnly={readOnly} />
      <DirectiveEditor patientId={patientId} readOnly={readOnly} />
    </div>
  )
}
