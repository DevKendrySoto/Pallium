'use client'

import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { DeactivateWizard } from '@/components/users/deactivate-wizard'
import { ResetPasswordDialog } from '@/components/users/reset-password-dialog'
import { RoleBadge } from '@/components/users/role-badge'
import { SessionList } from '@/components/users/session-list'
import { UserAvatar } from '@/components/users/user-avatar'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useActivateUser,
  useRevokeAllSessions,
  useRevokeSession,
  useRoles,
  useUpdateUser,
  useUserActivity,
  useUserDetail,
  useUserSessions,
} from '@/features/users'
import { cn } from '@/lib/utils'

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '—'}</dd>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: user, isLoading } = useUserDetail(id)
  const activate = useActivateUser()
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  if (isLoading || !user) {
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <div className="space-y-6">
      <Link href="/administracion/usuarios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Usuarios
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.fullName} roleCode={user.roles[0]?.code} size="lg" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.fullName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              {user.roles.map((r) => <RoleBadge key={r.code} code={r.code} />)}
              <Badge variant="outline" className={cn('font-medium', user.isActive ? 'border-transparent bg-success text-success-foreground' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              {user.mustChangePassword && <Badge variant="outline" className="border-amber-400 text-amber-700">Debe cambiar contraseña</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>Editar</Button>
          {user.isActive && (
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <KeyRound size={16} /> Restablecer contraseña
            </Button>
          )}
          {user.isActive ? (
            <Button variant="destructive" onClick={() => setDeactivateOpen(true)}>Desactivar</Button>
          ) : (
            <Button variant="outline" disabled={activate.isPending} onClick={() => activate.mutate(id)}>Reactivar</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="pt-4">
          <dl className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-3">
            <Field label="Teléfono" value={user.phone} />
            <Field label="Especialidad" value={user.specialty} />
            <Field label="Creado" value={fmt(user.createdAt)} />
            <Field label="Modificado" value={fmt(user.updatedAt)} />
            <Field label="Último login" value={fmt(user.lastLoginAt)} />
            <Field label="Contraseña cambiada" value={fmt(user.passwordChangedAt)} />
            <Field label="Sesiones activas" value={String(user._count.refreshTokens)} />
            {!user.isActive && <Field label="Desactivado" value={fmt(user.deactivatedAt)} />}
            {!user.isActive && <Field label="Motivo" value={user.deactivationReason} />}
          </dl>
        </TabsContent>

        <TabsContent value="sesiones" className="pt-4">
          <SessionsTab userId={id} />
        </TabsContent>

        <TabsContent value="actividad" className="pt-4">
          <ActivityTab userId={id} />
        </TabsContent>
      </Tabs>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        userId={id}
        initialName={user.fullName}
        initialRole={user.roles[0]?.code ?? ''}
      />
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} userId={id} userName={user.fullName} />
      <DeactivateWizard open={deactivateOpen} onOpenChange={setDeactivateOpen} user={user} />
    </div>
  )
}

function SessionsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useUserSessions(userId)
  const revoke = useRevokeSession(userId)
  const revokeAll = useRevokeAllSessions(userId)
  if (isLoading) return <Skeleton className="h-32 w-full" />
  return (
    <SessionList
      sessions={data ?? []}
      onRevoke={(id) => revoke.mutate(id)}
      onRevokeAll={() => revokeAll.mutate()}
      busy={revoke.isPending || revokeAll.isPending}
    />
  )
}

const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_TRANSITION', 'DISPATCH']

function ActivityTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const { data, isLoading } = useUserActivity(userId, page, action || undefined)
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20))

  return (
    <div className="space-y-3">
      <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="h-9 rounded-md border border-slate-200 px-2 text-sm">
        {ACTIONS.map((a) => <option key={a} value={a}>{a || 'Todas las acciones'}</option>)}
      </select>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad registrada.</p>
      ) : (
        <div className="space-y-2">
          {data!.items.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
              <span className="font-mono text-xs">{a.action}</span>
              <span className="text-muted-foreground">{a.entityType}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ''}</span>
              <span className="text-xs text-muted-foreground">{fmt(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
        <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
      </div>
    </div>
  )
}

function EditDialog({ open, onOpenChange, userId, initialName, initialRole }: { open: boolean; onOpenChange: (o: boolean) => void; userId: string; initialName: string; initialRole: string }) {
  const roles = useRoles()
  const update = useUpdateUser()
  const [fullName, setFullName] = useState(initialName)
  const [roleCode, setRoleCode] = useState(initialRole)

  function save() {
    update.mutate(
      { id: userId, fullName, roleCodes: [roleCode] },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Nombre completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Rol</Label>
            <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
              {roles.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={update.isPending || fullName.length < 3} onClick={save}>
            {update.isPending && <Loader2 size={18} className="animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
