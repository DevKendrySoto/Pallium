'use client'

import { CalendarClock, Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirmVisit, useRescheduleVisit } from '@/features/dashboard/hooks'
import { visitsToConfirmDataSchema, type VisitToConfirmItem } from '@/features/dashboard/types'

const MODALITY_LABEL: Record<string, string> = {
  HOME: 'Domicilio',
  CLINIC: 'Sede',
  TELEHEALTH: 'Teleconsulta',
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function VisitsToConfirmWidget({ data }: { data: unknown }) {
  const parsed = visitsToConfirmDataSchema.safeParse(data)
  const confirm = useConfirmVisit()
  const reschedule = useRescheduleVisit()
  const [target, setTarget] = useState<VisitToConfirmItem | null>(null)
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')

  if (!parsed.success) return null
  const { visits, total } = parsed.data

  async function onConfirm(id: string) {
    try {
      await confirm.mutateAsync({ id })
      toast.success('Visita confirmada')
    } catch {
      /* el wrapper de API ya muestra el error */
    }
  }

  async function onReschedule() {
    if (!target || !newDate) return
    try {
      await reschedule.mutateAsync({ id: target.id, scheduledDate: new Date(newDate).toISOString(), reason: reason || undefined })
      toast.success('Visita reprogramada')
      setTarget(null)
      setNewDate('')
      setReason('')
    } catch {
      /* manejado por el wrapper */
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Visitas por confirmar</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {visits.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay visitas por confirmar hoy.
          </p>
        ) : (
          <div className="space-y-2">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"
              >
                <span className="text-sm font-medium">{fmtTime(visit.scheduledAt)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{visit.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MODALITY_LABEL[visit.modality] ?? visit.modality}
                    {visit.type === 'EXTRAORDINARY' ? ' · Extraordinaria' : ''}
                  </p>
                </div>
                <Badge variant="outline">Agendada</Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="min-h-[44px] sm:min-h-9"
                    disabled={confirm.isPending}
                    onClick={() => onConfirm(visit.id)}
                  >
                    <Check size={16} /> Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] sm:min-h-9"
                    onClick={() => setTarget(visit)}
                  >
                    <CalendarClock size={16} /> Reprogramar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprogramar visita</DialogTitle>
            <DialogDescription>{target?.patient.name}</DialogDescription>
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
            <Button disabled={!newDate || reschedule.isPending} onClick={onReschedule}>
              {reschedule.isPending && <Loader2 size={18} className="animate-spin" />}
              Reprogramar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function VisitsToConfirmSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
