'use client'

import { MoreHorizontal } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACTIONABLE_STATUSES } from '@/features/visits/constants'
import { useCancelVisit, useCompleteVisit } from '@/features/visits/hooks'
import type { Visit } from '@/features/visits/types'

export function VisitRowActions({ visit }: { visit: Visit }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const complete = useCompleteVisit()
  const cancel = useCancelVisit()

  if (!ACTIONABLE_STATUSES.includes(visit.status)) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  function onCancel() {
    if (!reason.trim()) return
    cancel.mutate({ id: visit.id, reason }, { onSuccess: () => setCancelOpen(false) })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => complete.mutate(visit.id)}>
            Marcar realizada
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-danger focus:text-danger"
            onClick={() => setCancelOpen(true)}
          >
            Cancelar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar visita</DialogTitle>
            <DialogDescription>Indica el motivo de la cancelación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo</Label>
            <Input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej.: paciente hospitalizado"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={onCancel} disabled={!reason.trim() || cancel.isPending}>
              Cancelar visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
