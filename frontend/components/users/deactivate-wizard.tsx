'use client'

import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { useAdminCount, useDeactivateUser, useUsers } from '@/features/users'
import { useAuthStore } from '@/lib/auth-store'
import type { UserDetail } from '@/types/user'
import { roleMeta } from './role-meta'

interface Props {
  user: UserDetail
  open: boolean
  onOpenChange: (o: boolean) => void
}

type Mode = 'bulk' | 'unassigned'

/** Asistente de desactivación: resumen de impacto → reasignar citas → reasignar rutas → confirmar. */
export function DeactivateWizard({ user, open, onOpenChange }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const adminCount = useAdminCount()
  const allUsers = useUsers()
  const deactivate = useDeactivateUser(user.id)

  const [step, setStep] = useState(1)
  const [apptMode, setApptMode] = useState<Mode>('unassigned')
  const [apptTarget, setApptTarget] = useState('')
  const [routeMode, setRouteMode] = useState<Mode>('unassigned')
  const [routeTarget, setRouteTarget] = useState('')
  const [reason, setReason] = useState('')
  const [notifyCoordinator, setNotifyCoordinator] = useState(true)
  const [done, setDone] = useState<{ appointmentsReassigned: number; routesReassigned: number } | null>(null)

  const isSelf = currentUserId === user.id
  const isAdmin = user.roles.some((r) => r.code === 'ADMIN')
  const lastAdmin = isAdmin && (adminCount.data?.activeAdmins ?? 99) <= 1
  const blocked = isSelf || lastAdmin

  // Candidatos para reasignación: usuarios activos que comparten algún rol con el desactivado.
  const roleCodes = user.roles.map((r) => r.code)
  const candidates = useMemo(
    () =>
      (allUsers.data ?? []).filter(
        (u) => u.isActive && u.id !== user.id && u.roles.some((r) => roleCodes.includes(r.code)),
      ),
    [allUsers.data, user.id, roleCodes],
  )

  function reset() {
    setStep(1); setApptMode('unassigned'); setApptTarget('')
    setRouteMode('unassigned'); setRouteTarget(''); setReason('')
    setNotifyCoordinator(true); setDone(null)
  }
  function close() {
    onOpenChange(false)
    setTimeout(reset, 150)
  }

  function submit() {
    if (reason.trim().length < 10) return
    deactivate.mutate(
      {
        reason: reason.trim(),
        reassignFutureAppointments: apptMode,
        appointmentsReassignTo: apptMode === 'bulk' ? apptTarget : undefined,
        reassignFutureRoutes: routeMode,
        routesReassignTo: routeMode === 'bulk' ? routeTarget : undefined,
        notifyCoordinator,
      },
      {
        onSuccess: (r) => {
          setDone({ appointmentsReassigned: r.appointmentsReassigned, routesReassigned: r.routesReassigned })
          toast.success('Usuario desactivado')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo desactivar'),
      },
    )
  }

  const apptValid = apptMode === 'unassigned' || apptTarget !== ''
  const routeValid = routeMode === 'unassigned' || routeTarget !== ''
  const reasonValid = reason.trim().length >= 10

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="sm:max-w-lg">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success"><CheckCircle2 size={18} /> Usuario desactivado</DialogTitle>
              <DialogDescription>Se completó la desactivación y la reasignación.</DialogDescription>
            </DialogHeader>
            <ul className="space-y-1 rounded-md border border-slate-200 p-3 text-sm">
              <li>Citas futuras reasignadas: <span className="font-medium">{done.appointmentsReassigned}</span></li>
              <li>Rutas futuras reasignadas: <span className="font-medium">{done.routesReassigned}</span></li>
              <li>Sesiones cerradas: <span className="font-medium">{user._count.refreshTokens}</span></li>
            </ul>
            <DialogFooter><Button onClick={close}>Listo</Button></DialogFooter>
          </>
        ) : blocked ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-danger"><ShieldAlert size={18} /> No se puede desactivar</DialogTitle>
              <DialogDescription>Esta cuenta no puede desactivarse en este momento.</DialogDescription>
            </DialogHeader>
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {isSelf
                ? 'No puedes desactivar tu propia cuenta. Pídele a otro administrador que lo haga.'
                : 'Este es el último administrador activo del sistema. Asigna el rol de administrador a otra cuenta antes de desactivarlo.'}
            </div>
            <DialogFooter><Button variant="outline" onClick={close}>Entendido</Button></DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Desactivar a {user.fullName}</DialogTitle>
              <DialogDescription>Paso {step} de 4</DialogDescription>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <p>Al desactivar, el usuario no podrá iniciar sesión. Se cerrarán sus <span className="font-medium">{user._count.refreshTokens}</span> sesión(es) activa(s) y sus citas y rutas futuras quedarán sin responsable salvo que las reasignes.</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-3">
                  <div><dt className="text-xs text-muted-foreground">Usuario</dt><dd>{user.fullName}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Roles</dt><dd>{user.roles.map((r) => roleMeta(r.code).label).join(', ')}</dd></div>
                </dl>
              </div>
            )}

            {step === 2 && (
              <ReassignStep
                title="Citas futuras"
                mode={apptMode} setMode={setApptMode}
                target={apptTarget} setTarget={setApptTarget}
                candidates={candidates}
              />
            )}

            {step === 3 && (
              <ReassignStep
                title="Rutas futuras"
                mode={routeMode} setMode={setRouteMode}
                target={routeTarget} setTarget={setRouteTarget}
                candidates={candidates}
              />
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Motivo de la desactivación</Label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Ej.: el colaborador finalizó su contrato el 30/06."
                    className="w-full rounded-md border border-slate-200 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 10 caracteres. Queda registrado en auditoría.</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyCoordinator} onChange={(e) => setNotifyCoordinator(e.target.checked)} className="size-4" />
                  Notificar al coordinador médico
                </label>
                <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  Esta acción cerrará las sesiones del usuario y aplicará las reasignaciones elegidas. Es reversible reactivando la cuenta, pero las reasignaciones no se revierten.
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => (step === 1 ? close() : setStep((s) => s - 1))}>
                {step === 1 ? 'Cancelar' : 'Atrás'}
              </Button>
              {step < 4 ? (
                <Button
                  disabled={(step === 2 && !apptValid) || (step === 3 && !routeValid)}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Siguiente
                </Button>
              ) : (
                <Button variant="destructive" disabled={!reasonValid || deactivate.isPending} onClick={submit}>
                  {deactivate.isPending && <Loader2 size={18} className="animate-spin" />} Confirmar desactivación
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReassignStep({
  title, mode, setMode, target, setTarget, candidates,
}: {
  title: string
  mode: Mode
  setMode: (m: Mode) => void
  target: string
  setTarget: (t: string) => void
  candidates: { id: string; fullName: string }[]
}) {
  const noCandidates = candidates.length === 0
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">{title}</p>
      <label className="flex items-start gap-2">
        <input type="radio" checked={mode === 'unassigned'} onChange={() => setMode('unassigned')} className="mt-1" />
        <span>Dejar sin asignar <span className="text-muted-foreground">(coordinación las reasignará luego)</span></span>
      </label>
      <label className="flex items-start gap-2">
        <input type="radio" checked={mode === 'bulk'} onChange={() => setMode('bulk')} disabled={noCandidates} className="mt-1" />
        <span className={noCandidates ? 'text-muted-foreground' : ''}>
          Reasignar a otro usuario{noCandidates && ' (no hay usuarios activos del mismo rol)'}
        </span>
      </label>
      {mode === 'bulk' && (
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
        >
          <option value="">Selecciona un usuario…</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
      )}
    </div>
  )
}
