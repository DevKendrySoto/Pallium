'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, MapPin, PenLine } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { DynamicForm } from '@/components/visits/clinical/dynamic-form'
import { VisitStatusBadge, VisitTypeBadge } from '@/components/visits/visit-badges'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatient } from '@/features/patients/hooks'
import {
  roleToSpecialty,
  useCheckIn,
  useCloseVisit,
  useResolveTemplate,
  useSaveClinicalRecord,
  useSignVisit,
  useVisit,
} from '@/features/visits/flow'
import { useReadOnly } from '@/hooks/use-read-only'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { ClinicalRecordSections, VisitOutcome } from '@/types/clinical'

const OUTCOMES: { value: VisitOutcome; label: string }[] = [
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'PATIENT_NOT_HOME', label: 'Fuera de casa' },
  { value: 'OUT_OF_TIME', label: 'Fuera de tiempo' },
  { value: 'REFUSED', label: 'Rehúso de atención' },
]

const ACTIVE_STATES = ['SCHEDULED', 'CONFIRMED', 'EN_ROUTE']

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function VisitPage() {
  const { id } = useParams<{ id: string }>()
  const role = useAuthStore((s) => s.role)
  const readOnly = useReadOnly()
  const { data: visit, isLoading, isError } = useVisit(id)
  const { data: patient } = usePatient(visit?.patientId ?? '')

  const categoryCode = patient?.category?.code
  const { data: template } = useResolveTemplate(roleToSpecialty(role), categoryCode)

  const checkIn = useCheckIn(id)
  const save = useSaveClinicalRecord(id)
  const close = useCloseVisit(id)
  const sign = useSignVisit(id)

  const allergies = useQuery({
    queryKey: ['allergies', visit?.patientId],
    enabled: Boolean(visit?.patientId),
    queryFn: () => api.get<{ id: string; substance: string }[]>(`/patients/${visit!.patientId}/allergies`),
  })

  const [form, setForm] = useState<ClinicalRecordSections>({})
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)
  const [outcome, setOutcome] = useState<VisitOutcome>('COMPLETED')
  const [reason, setReason] = useState('')
  const [signerName, setSignerName] = useState('')

  const recordSpecialty = useMemo(
    () => roleToSpecialty(role) ?? template?.specialty ?? 'MEDICINE',
    [role, template],
  )

  // Auto-save de borrador (debounce 2s tras cambios), solo durante la visita.
  useEffect(() => {
    if (visit?.status !== 'IN_PROGRESS' || !template) return
    if (Object.keys(form).length === 0) return
    const t = setTimeout(() => {
      save.mutate(
        { specialty: recordSpecialty, templateKey: template.key, data: { sections: form } },
        { onSuccess: () => setSavedAt(new Date().toLocaleTimeString('es')) },
      )
    }, 2000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  function startVisit() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => checkIn.mutate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => checkIn.mutate({}),
        { timeout: 8000 },
      )
    } else {
      checkIn.mutate({})
    }
  }

  function confirmClose() {
    const finish = () =>
      close.mutate(
        { outcome, reason: reason || undefined },
        { onSuccess: () => setCloseOpen(false) },
      )
    if (outcome === 'COMPLETED' && signerName.trim()) {
      sign.mutate(
        { storageKey: `manual/${id}`, signerName },
        { onSuccess: finish, onError: finish },
      )
    } else {
      finish()
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (isError || !visit) return <p className="text-sm text-danger">No se pudo cargar la visita.</p>

  const inProgress = visit.status === 'IN_PROGRESS'
  const canStart = ACTIVE_STATES.includes(visit.status)

  return (
    <div className="space-y-6">
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Agenda
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {visit.patient.firstName} {visit.patient.lastName}
            </h1>
            <VisitStatusBadge status={visit.status} />
            <VisitTypeBadge type={visit.type} reason={visit.reason} />
          </div>
          <p className="text-sm text-muted-foreground">{fmt(visit.scheduledDate)}</p>
          {(allergies.data?.length ?? 0) > 0 && (
            <p className="text-sm text-danger">
              Alergias: {allergies.data!.map((a) => a.substance).join(', ')}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!readOnly && canStart && (
            <Button onClick={startVisit} disabled={checkIn.isPending}>
              {checkIn.isPending ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
              Iniciar visita
            </Button>
          )}
          {!readOnly && inProgress && (
            <Button onClick={() => setCloseOpen(true)}>Cerrar visita</Button>
          )}
        </div>
      </div>

      {inProgress && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {template ? template.name : 'Resolviendo plantilla…'}
            </p>
            <p className="text-xs text-muted-foreground">
              {save.isPending ? 'Guardando…' : savedAt ? `Borrador guardado ${savedAt}` : ''}
            </p>
          </div>
          {template ? (
            <DynamicForm
              sections={template.sections}
              value={form}
              onChange={setForm}
              ctx={{ patientId: visit.patientId, visitId: id }}
            />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </>
      )}

      {!inProgress && !canStart && (
        <p className="text-sm text-muted-foreground">
          Visita {visit.status.toLowerCase()}
          {visit.outcome ? ` · resultado: ${visit.outcome}` : ''}.
        </p>
      )}

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <div className="flex flex-wrap gap-2">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOutcome(o.value)}
                    className={`min-h-9 rounded-md border px-3 text-sm ${
                      outcome === o.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {outcome !== 'COMPLETED' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}

            {outcome === 'COMPLETED' && (
              <div className="space-y-2">
                <Label htmlFor="signer" className="flex items-center gap-1">
                  <PenLine size={14} /> Firma del cuidador (nombre)
                </Label>
                <Input
                  id="signer"
                  placeholder="Nombre de quien firma"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Volver
            </Button>
            <Button onClick={confirmClose} disabled={close.isPending || sign.isPending}>
              {(close.isPending || sign.isPending) && <Loader2 size={18} className="animate-spin" />}
              Confirmar cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
