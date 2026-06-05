'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
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

export interface DeathDetails {
  deathDate: string
  deathPlace: string
  reason: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  pending?: boolean
  onConfirm: (details: DeathDetails) => void
}

/** Captura los datos obligatorios del deceso (fecha, lugar y motivo). */
export function DeathDialog({ open, onOpenChange, patientName, pending, onConfirm }: Props) {
  const [deathDate, setDeathDate] = useState('')
  const [deathPlace, setDeathPlace] = useState('')
  const [reason, setReason] = useState('')

  const valid = deathDate && deathPlace.trim() && reason.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar deceso</DialogTitle>
          <DialogDescription>
            {patientName}. Esta acción es irreversible y notifica a la coordinación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Fecha del deceso</Label>
            <Input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Lugar del deceso</Label>
            <Input
              value={deathPlace}
              onChange={(e) => setDeathPlace(e.target.value)}
              placeholder="Domicilio, hospital, etc."
            />
          </div>
          <div className="space-y-1">
            <Label>Motivo / causa</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!valid || pending}
            onClick={() => valid && onConfirm({ deathDate, deathPlace, reason })}
          >
            {pending && <Loader2 size={18} className="animate-spin" />}
            Confirmar deceso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
