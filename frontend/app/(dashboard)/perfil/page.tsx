'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { SessionList } from '@/components/users/session-list'
import { UserAvatar } from '@/components/users/user-avatar'
import { PasswordStrengthMeter, passwordScore } from '@/components/users/password-strength-meter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMySessions,
  useRevokeMySession,
  useRevokeMySessions,
  useUpdateMe,
} from '@/features/users'
import { useAuthStore } from '@/lib/auth-store'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const clearMustChange = useAuthStore((s) => s.clearMustChangePassword)
  const update = useUpdateMe()
  const sessions = useMySessions()
  const revoke = useRevokeMySession()
  const revokeAll = useRevokeMySessions()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  if (!user) return <Skeleton className="h-64 w-full" />

  const pwValid = passwordScore(newPassword).score === 4 && currentPassword.length > 0

  function saveInfo() {
    update.mutate(
      { fullName, phone: phone || undefined },
      { onSuccess: () => toast.success('Perfil actualizado') },
    )
  }
  function changePassword() {
    update.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada')
          clearMustChange()
          setCurrentPassword(''); setNewPassword('')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {user.mustChangePassword && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          <AlertTriangle size={18} />
          Debes cambiar tu contraseña antes de continuar usando el sistema.
        </div>
      )}

      <div className="flex items-center gap-4">
        <UserAvatar name={user.fullName ?? user.email} roleCode={user.roles[0]} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.fullName ?? user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Nombre completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <Button disabled={update.isPending || fullName.length < 3} onClick={saveInfo}>
            {update.isPending && <Loader2 size={18} className="animate-spin" />} Guardar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Seguridad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Contraseña actual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              {newPassword && <PasswordStrengthMeter value={newPassword} />}
            </div>
          </div>
          <Button disabled={!pwValid || update.isPending} onClick={changePassword}>Cambiar contraseña</Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Mis sesiones activas</CardTitle></CardHeader>
        <CardContent>
          {sessions.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <SessionList
              sessions={sessions.data ?? []}
              onRevoke={(id) => revoke.mutate(id)}
              onRevokeAll={() => revokeAll.mutate()}
              busy={revoke.isPending || revokeAll.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
