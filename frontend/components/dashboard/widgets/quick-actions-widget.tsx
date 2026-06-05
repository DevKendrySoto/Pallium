'use client'

import { CalendarClock, ClipboardList, Clock, Loader2, Stethoscope, UserX, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDashboardSelection } from '@/components/dashboard/dashboard-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  useRescheduleVisit,
  useStartVisitComplete,
  useVisitOutcome,
} from '@/features/dashboard/hooks'
import { quickActionsDataSchema } from '@/features/dashboard/types'

type Modal = 'start' | 'absent' | 'outoftime' | 'refused' | 'reschedule' | null

const ACTION_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  start_visit: Stethoscope,
  apply_scale: ClipboardList,
  mark_patient_absent: UserX,
  mark_out_of_time: Clock,
  mark_care_refused: XCircle,
  reschedule: CalendarClock,
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-24 w-full rounded-md border border-slate-200 p-2 text-base focus:outline-none focus:ring-1 focus:ring-primary"
    />
  )
}

export function QuickActionsWidget({ data }: { data: unknown }) {
  const parsed = quickActionsDataSchema.safeParse(data)
  const { selectedVisit, selectVisit } = useDashboardSelection()
  const [modal, setModal] = useState<Modal>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [newDate, setNewDate] = useState('')

  const router = useRouter()
  const outcome = useVisitOutcome()
  const start = useStartVisitComplete()
  const reschedule = useRescheduleVisit()
  const pending = outcome.isPending || start.isPending || reschedule.isPending

  if (!parsed.success) return null
  const actions = parsed.data.actions
  const open = selectedVisit !== null

  function close() {
    setModal(null)
    setReason('')
    setNote('')
    setNewDate('')
    selectVisit(null)
  }

  async function run(key: string) {
    if (!selectedVisit) return
    const id = selectedVisit.id
    try {
      if (key === 'mark_patient_absent') {
        await outcome.mutateAsync({ id, outcome: 'PATIENT_NOT_HOME', reason: reason || undefined })
        toast.success('Registrado: paciente fuera de casa')
      } else if (key === 'mark_out_of_time') {
        await outcome.mutateAsync({ id, outcome: 'OUT_OF_TIME', reason: reason || undefined })
        toast.success('Registrado. Se agendó como prioridad para mañana')
      } else if (key === 'mark_care_refused') {
        const res = await outcome.mutateAsync({ id, outcome: 'REFUSED', reason: reason || undefined })
        toast.success(`Rehúso registrado (${res.refusalCount ?? '—'} rehúsos del paciente)`)
        if (res.consideredPassive) {
          toast.warning('Se notificó al coordinador médico para evaluar el estado del paciente')
        }
      } else if (key === 'reschedule') {
        if (!newDate) return
        await reschedule.mutateAsync({ id, scheduledDate: new Date(newDate).toISOString(), reason: reason || undefined })
        toast.success('Visita reprogramada')
      }
      close()
    } catch {
      /* el wrapper de API ya muestra el toast de error */
    }
  }

  async function saveStartVisit() {
    if (!selectedVisit || !note.trim()) return
    try {
      await start.mutateAsync({ id: selectedVisit.id, note })
      toast.success('Visita completada')
      close()
    } catch {
      /* manejado por el wrapper */
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && close()}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{selectedVisit?.patient.fullName ?? 'Visita'}</SheetTitle>
            <SheetDescription>¿Qué quieres registrar para esta visita?</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {actions.map((action) => {
              const Icon = ACTION_ICON[action.key]
              const isCompleted = selectedVisit?.status === 'COMPLETED'
              return (
                <Button
                  key={action.key}
                  variant={action.key === 'start_visit' ? 'default' : 'outline'}
                  className="min-h-[44px] w-full justify-start gap-2"
                  disabled={pending || isCompleted}
                  onClick={() => {
                    if (action.key === 'start_visit') setModal('start')
                    else if (action.key === 'apply_scale') {
                      if (selectedVisit) router.push(`/patients/${selectedVisit.patient.id}?tab=clinico`)
                      close()
                    } else if (action.key === 'mark_patient_absent') setModal('absent')
                    else if (action.key === 'mark_out_of_time') setModal('outoftime')
                    else if (action.key === 'mark_care_refused') setModal('refused')
                    else if (action.key === 'reschedule') setModal('reschedule')
                  }}
                >
                  {Icon && <Icon size={18} />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Drawer "Iniciar visita" — puente al registro clínico. Solo al guardar completa la visita. */}
      <Dialog open={modal === 'start'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registro de enfermería</DialogTitle>
            <DialogDescription>
              Registra la nota clínica. La visita se completará al guardar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Nota clínica</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Evolución, hallazgos, indicaciones…" />
          </div>
          <DialogFooter>
            <Button disabled={!note.trim() || start.isPending} onClick={saveStartVisit}>
              {start.isPending && <Loader2 size={18} className="animate-spin" />}
              Guardar y completar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReasonModal
        open={modal === 'absent'}
        title="Paciente fuera de casa"
        reason={reason}
        setReason={setReason}
        pending={pending}
        onConfirm={() => run('mark_patient_absent')}
        onClose={() => setModal(null)}
      />
      <ReasonModal
        open={modal === 'outoftime'}
        title="Fuera de tiempo"
        description="Se agendará como prioridad para mañana."
        reason={reason}
        setReason={setReason}
        pending={pending}
        onConfirm={() => run('mark_out_of_time')}
        onClose={() => setModal(null)}
      />
      <ReasonModal
        open={modal === 'refused'}
        title="Rehúso de atención"
        reason={reason}
        setReason={setReason}
        pending={pending}
        destructive
        onConfirm={() => run('mark_care_refused')}
        onClose={() => setModal(null)}
      />

      <Dialog open={modal === 'reschedule'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprogramar visita</DialogTitle>
            <DialogDescription>Elige la nueva fecha y hora de la visita.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nueva fecha y hora</Label>
              <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Motivo (opcional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!newDate || reschedule.isPending} onClick={() => run('reschedule')}>
              {reschedule.isPending && <Loader2 size={18} className="animate-spin" />}
              Reprogramar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReasonModal({
  open,
  title,
  description,
  reason,
  setReason,
  pending,
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  reason: string
  setReason: (v: string) => void
  pending: boolean
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? 'Registra el resultado de la visita.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label>Razón (opcional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant={destructive ? 'destructive' : 'default'} disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 size={18} className="animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
