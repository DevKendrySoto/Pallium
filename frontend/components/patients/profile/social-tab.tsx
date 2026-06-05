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
  useCaregivers,
  useCreateCaregiver,
  useCreateFamilyMember,
  useCreateImmunization,
  useDeleteCaregiver,
  useDeleteFamilyMember,
  useDeleteImmunization,
  useFamily,
  useImmunizations,
  useSocialProfile,
  useUpsertSocialProfile,
} from '@/features/profile/hooks'
import { useReadOnly } from '@/hooks/use-read-only'

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

function CaregiversEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useCaregivers(patientId)
  const create = useCreateCaregiver(patientId)
  const del = useDeleteCaregiver(patientId)
  const [fullName, setFullName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [phone, setPhone] = useState('')

  function add() {
    if (!fullName.trim()) return
    create.mutate(
      { fullName, relationship: relationship || undefined, phone: phone || undefined },
      { onSuccess: () => { setFullName(''); setRelationship(''); setPhone('') } },
    )
  }

  return (
    <SectionCard title="Cuidadores">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Sin cuidadores.</p>}
      {data?.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
          <div className="text-sm">
            <span className="font-medium">{c.fullName}</span>{' '}
            {c.isPrimary && <Badge variant="outline" className="border-primary/40 text-primary">Principal</Badge>}{' '}
            <span className="text-muted-foreground">
              {[c.relationship, c.phone].filter(Boolean).join(' · ')}
            </span>
          </div>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => del.mutate(c.id)}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-200 p-3 sm:grid-cols-3">
          <Input placeholder="Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="Parentesco" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          <Input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="sm:col-span-3">
            <Button size="sm" onClick={add} disabled={create.isPending || !fullName.trim()}>
              {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Agregar cuidador
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function FamilyEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useFamily(patientId)
  const create = useCreateFamilyMember(patientId)
  const del = useDeleteFamilyMember(patientId)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')

  function add() {
    if (!name.trim() || !relationship.trim()) return
    create.mutate({ name, relationship, role: 'SUPPORT' }, { onSuccess: () => { setName(''); setRelationship('') } })
  }

  return (
    <SectionCard title="Composición familiar">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Sin familiares registrados.</p>}
      {data?.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
          <span className="text-sm">
            <span className="font-medium">{f.name}</span>{' '}
            <span className="text-muted-foreground">{f.relationship}{f.age ? ` · ${f.age} años` : ''}</span>
          </span>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => del.mutate(f.id)}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-200 p-3 sm:grid-cols-2">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Parentesco" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          <div className="sm:col-span-2">
            <Button size="sm" onClick={add} disabled={create.isPending || !name.trim() || !relationship.trim()}>
              <Plus size={16} /> Agregar familiar
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function SocialProfileEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useSocialProfile(patientId)
  const upsert = useUpsertSocialProfile(patientId)
  const [form, setForm] = useState<Record<string, string>>({})
  const v = (k: string) => form[k] ?? (data as Record<string, unknown> | null)?.[k]?.toString() ?? ''
  const set = (k: string, val: string) => setForm((p) => ({ ...p, [k]: val }))

  function save() {
    upsert.mutate({
      housingType: v('housingType') || undefined,
      incomeLevel: v('incomeLevel') || undefined,
      insurance: v('insurance') || undefined,
      occupation: v('occupation') || undefined,
      notes: v('notes') || undefined,
    })
  }

  return (
    <SectionCard title="Vivienda y situación socioeconómica">
      {isLoading && <Skeleton className="h-6 w-full" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['housingType', 'Tipo de vivienda'],
          ['incomeLevel', 'Nivel de ingresos'],
          ['insurance', 'Seguro de salud'],
          ['occupation', 'Ocupación'],
        ].map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input value={v(k)} disabled={readOnly} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Observaciones</Label>
          <Input value={v('notes')} disabled={readOnly} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      {!readOnly && (
        <Button size="sm" variant="outline" onClick={save} disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 size={16} className="animate-spin" />}
          Guardar
        </Button>
      )}
    </SectionCard>
  )
}

function ImmunizationsEditor({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data, isLoading } = useImmunizations(patientId)
  const create = useCreateImmunization(patientId)
  const del = useDeleteImmunization(patientId)
  const [vaccine, setVaccine] = useState('')
  const [date, setDate] = useState('')

  function add() {
    if (!vaccine.trim() || !date) return
    create.mutate({ vaccine, date }, { onSuccess: () => { setVaccine(''); setDate('') } })
  }

  return (
    <SectionCard title="Inmunizaciones">
      {isLoading && <Skeleton className="h-6 w-full" />}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Sin inmunizaciones.</p>}
      {data?.map((im) => (
        <div key={im.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
          <span className="text-sm">
            <span className="font-medium">{im.vaccine}</span>{' '}
            <span className="text-muted-foreground">{im.date.slice(0, 10)}{im.dose ? ` · ${im.dose}` : ''}</span>
          </span>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => del.mutate(im.id)}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-200 p-3 sm:grid-cols-2">
          <Input placeholder="Vacuna" value={vaccine} onChange={(e) => setVaccine(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="sm:col-span-2">
            <Button size="sm" onClick={add} disabled={create.isPending || !vaccine.trim() || !date}>
              <Plus size={16} /> Agregar inmunización
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

export function SocialTab({ patientId }: { patientId: string }) {
  const readOnly = useReadOnly()
  return (
    <div className="space-y-4">
      <CaregiversEditor patientId={patientId} readOnly={readOnly} />
      <FamilyEditor patientId={patientId} readOnly={readOnly} />
      <SocialProfileEditor patientId={patientId} readOnly={readOnly} />
      <ImmunizationsEditor patientId={patientId} readOnly={readOnly} />
    </div>
  )
}
