'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PatientStatusBadge } from '@/components/patients/patient-status-badge'
import { PatientTimeline } from '@/components/patients/patient-timeline'
import { ClinicalTab } from '@/components/patients/profile/clinical-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ALLOWED_TRANSITIONS,
  ID_TYPE_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
} from '@/features/patients/constants'
import {
  useApprovePatient,
  useChangePatientStatus,
  usePatient,
} from '@/features/patients/hooks'
import { useReadOnly } from '@/hooks/use-read-only'
import type { PatientStatus } from '@/types/patient'

const TRANSITION_LABELS: Record<PatientStatus, string> = {
  ACTIVE: 'Reactivar',
  PASSIVE: 'Pasar a pasivo',
  DECEASED: 'Registrar deceso',
  PENDING_APPROVAL: 'Pendiente',
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '—'}</dd>
    </div>
  )
}

function fmtDate(value: string | null): string {
  return value ? value.slice(0, 10) : '—'
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading, isError } = usePatient(id)
  const approve = useApprovePatient()
  const changeStatus = useChangePatientStatus()
  const readOnly = useReadOnly()

  const busy = approve.isPending || changeStatus.isPending

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Pacientes
      </Link>

      {isLoading && <Skeleton className="h-48 w-full" />}
      {isError && <p className="text-sm text-danger">No se pudo cargar el paciente.</p>}

      {patient && (
        <>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                <PatientStatusBadge status={patient.status} />
              </div>
              <p className="font-mono text-xs text-muted-foreground">{patient.mrn}</p>
            </div>

            <div className="flex gap-2">
              {!readOnly && patient.status === 'PENDING_APPROVAL' && (
                <Button onClick={() => approve.mutate(patient.id)} disabled={busy}>
                  {busy && <Loader2 size={18} className="animate-spin" />}
                  Aprobar admisión
                </Button>
              )}
              {!readOnly &&
                ALLOWED_TRANSITIONS[patient.status].map((target) => (
                <Button
                  key={target}
                  variant={target === 'DECEASED' ? 'destructive' : 'outline'}
                  disabled={busy}
                  onClick={() => changeStatus.mutate({ id: patient.id, status: target })}
                >
                  {TRANSITION_LABELS[target]}
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="resumen">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="clinico">Clínico</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="pt-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Datos del paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label="Identificación"
                      value={`${ID_TYPE_LABELS[patient.identificationType]} · ${patient.identificationNo}`}
                    />
                    <Field label="Sexo" value={SEX_LABELS[patient.sex]} />
                    <Field label="Fecha de nacimiento" value={fmtDate(patient.birthDate)} />
                    <Field label="Categoría" value={patient.category?.name} />
                    <Field label="Estado" value={STATUS_LABELS[patient.status]} />
                    <Field label="Teléfono" value={patient.phone} />
                    <Field label="Correo" value={patient.email} />
                    <Field label="Admisión" value={fmtDate(patient.admittedAt)} />
                    <Field label="Próxima visita regular" value={fmtDate(patient.nextRegularVisitDue)} />
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clinico" className="pt-4">
              <ClinicalTab patientId={patient.id} />
            </TabsContent>

            <TabsContent value="historial" className="pt-4">
              <PatientTimeline patientId={patient.id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
