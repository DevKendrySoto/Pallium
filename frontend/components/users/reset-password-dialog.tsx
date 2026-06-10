'use client'

import { KeyRound, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useResetPassword } from '@/features/users'
import { CopyToClipboard } from './copy-to-clipboard'

interface Props {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (o: boolean) => void
}

/** Restablece la contraseña de un usuario: pide motivo y muestra la clave temporal una sola vez. */
export function ResetPasswordDialog({ userId, userName, open, onOpenChange }: Props) {
  const reset = useResetPassword(userId)
  const [reason, setReason] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  function close() {
    onOpenChange(false)
    // Limpiamos al cerrar para no filtrar la clave si se reabre.
    setTimeout(() => { setReason(''); setTempPassword(null) }, 150)
  }

  function submit() {
    if (reason.trim().length < 3) return
    reset.mutate(reason.trim(), {
      onSuccess: (r) => setTempPassword(r.temporaryPassword),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="sm:max-w-md">
        {tempPassword === null ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound size={18} /> Restablecer contraseña</DialogTitle>
              <DialogDescription>
                Se generará una contraseña temporal para <span className="font-medium text-foreground">{userName}</span>.
                Sus sesiones activas se cerrarán y deberá cambiarla al iniciar sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ej.: el usuario olvidó su contraseña y solicitó el restablecimiento."
                className="w-full rounded-md border border-slate-200 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">Mínimo 3 caracteres. Queda registrado en auditoría.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Cancelar</Button>
              <Button disabled={reason.trim().length < 3 || reset.isPending} onClick={submit}>
                {reset.isPending && <Loader2 size={18} className="animate-spin" />} Restablecer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Contraseña temporal</DialogTitle>
              <DialogDescription>Esta contraseña no se mostrará de nuevo. Compártala por un canal seguro.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
              <p><span className="text-muted-foreground">Usuario:</span> {userName}</p>
              <p><span className="text-muted-foreground">Contraseña:</span> <span className="font-mono">{tempPassword}</span></p>
              <CopyToClipboard value={tempPassword} label="Copiar contraseña" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Listo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
