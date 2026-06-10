'use client'

import { Check, Copy, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  useApproveUserRequest,
  useRejectUserRequest,
  type ApproveUserRequestResult,
} from '@/features/dashboard/hooks'
import { pendingUserRequestsDataSchema, type PendingUserRequestItem } from '@/features/dashboard/types'

export function PendingUserRequestsWidget({ data }: { data: unknown }) {
  const approve = useApproveUserRequest()
  const reject = useRejectUserRequest()
  const [approveTarget, setApproveTarget] = useState<PendingUserRequestItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingUserRequestItem | null>(null)
  const [roleOverride, setRoleOverride] = useState('')
  const [reason, setReason] = useState('')
  const [creds, setCreds] = useState<ApproveUserRequestResult | null>(null)

  const parsed = pendingUserRequestsDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { items, total } = parsed.data

  async function doApprove() {
    if (!approveTarget) return
    try {
      const res = await approve.mutateAsync({ id: approveTarget.id, roleCode: roleOverride || undefined })
      setCreds(res)
      setApproveTarget(null)
      setRoleOverride('')
      toast.success('Usuario aprobado')
    } catch {
      /* manejado por el wrapper */
    }
  }

  async function doReject() {
    if (!rejectTarget || !reason.trim()) return
    try {
      await reject.mutateAsync({ id: rejectTarget.id, reason })
      toast.success('Solicitud rechazada')
      setRejectTarget(null)
      setReason('')
    } catch {
      /* manejado por el wrapper */
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Solicitudes de usuario</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.fullName} · {r.roleCode}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.email} · solicitado por {r.requestedBy}
                    {r.reason ? ` · ${r.reason}` : ''}
                  </p>
                </div>
                <Button size="sm" className="min-h-[44px] sm:min-h-9" onClick={() => setApproveTarget(r)}>
                  <Check size={16} /> Aprobar
                </Button>
                <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-9" onClick={() => setRejectTarget(r)}>
                  <X size={16} /> Rechazar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Aprobar */}
      <Dialog open={approveTarget !== null} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprobar usuario</DialogTitle>
            <DialogDescription>{approveTarget?.fullName} · {approveTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Rol (puedes ajustarlo)</Label>
            <Input
              placeholder={approveTarget?.roleCode}
              value={roleOverride}
              onChange={(e) => setRoleOverride(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button disabled={approve.isPending} onClick={doApprove}>
              {approve.isPending && <Loader2 size={18} className="animate-spin" />}
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credenciales temporales */}
      <Dialog open={creds !== null} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Credenciales temporales</DialogTitle>
            <DialogDescription>Cópialas y entrégalas. El usuario deberá cambiar la contraseña.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
            <p><span className="text-muted-foreground">Correo:</span> {creds?.email}</p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Contraseña:</span>
              <span className="font-mono">{creds?.temporaryPassword}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  if (creds) navigator.clipboard?.writeText(creds.temporaryPassword)
                  toast.success('Contraseña copiada')
                }}
              >
                <Copy size={14} />
              </Button>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreds(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rechazar */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>{rejectTarget?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Motivo (obligatorio)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" disabled={!reason.trim() || reject.isPending} onClick={doReject}>
              {reject.isPending && <Loader2 size={18} className="animate-spin" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
