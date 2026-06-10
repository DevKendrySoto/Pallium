'use client'

import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CopyToClipboard } from '@/components/users/copy-to-clipboard'
import { PasswordStrengthMeter, passwordScore } from '@/components/users/password-strength-meter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateUser, useRoles } from '@/features/users'

function genTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `P${s}#7`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewUserPage() {
  const router = useRouter()
  const roles = useRoles()
  const create = useCreateUser()

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [password, setPassword] = useState(genTempPassword())
  const [created, setCreated] = useState<{ id: string; email: string; password: string } | null>(null)

  const step1Valid = fullName.trim().length >= 3 && EMAIL_RE.test(email)
  const step2Valid = roleCode !== ''
  const pwValid = passwordScore(password).score === 4

  function submit() {
    if (!step1Valid || !step2Valid || !pwValid) return
    create.mutate(
      { email: email.trim(), fullName: fullName.trim(), password, roleCodes: [roleCode], specialty: specialty.trim() || undefined },
      { onSuccess: (u) => setCreated({ id: u.id, email: email.trim(), password }) },
    )
  }

  if (created) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 size={20} /><h1 className="text-xl font-semibold">Usuario creado</h1>
        </div>
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Credenciales</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">No se mostrarán de nuevo. Compártalas por un canal seguro; el usuario deberá cambiar la contraseña al iniciar sesión.</p>
            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              <p><span className="text-muted-foreground">Correo:</span> {created.email}</p>
              <p><span className="text-muted-foreground">Contraseña:</span> <span className="font-mono">{created.password}</span></p>
              <CopyToClipboard value={`${created.email}\n${created.password}`} label="Copiar todo" />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/administracion/usuarios/${created.id}`)}>Ver usuario</Button>
          <Button variant="outline" onClick={() => router.push('/administracion/usuarios')}>Volver a la lista</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link href="/administracion/usuarios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Usuarios
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo usuario</h1>
        <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-4 pt-6">
          {step === 1 && (
            <>
              <div className="space-y-1"><Label>Nombre completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej.: Ana Pérez López" /></div>
              <div className="space-y-1">
                <Label>Correo</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@pallium.local" />
                {email && !EMAIL_RE.test(email) && <p className="text-xs text-danger">Correo no válido.</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1">
                <Label>Rol</Label>
                <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
                  <option value="">Selecciona un rol</option>
                  {roles.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Especialidad <span className="text-muted-foreground">(opcional)</span></Label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej.: Medicina paliativa" />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Contraseña temporal</Label>
                <Button variant="ghost" size="sm" onClick={() => setPassword(genTempPassword())}>Generar otra</Button>
              </div>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
              <PasswordStrengthMeter value={password} />
              <p className="text-xs text-muted-foreground">El usuario deberá cambiarla en su primer inicio de sesión.</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => (step === 1 ? router.push('/administracion/usuarios') : setStep((s) => s - 1))}>
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </Button>
            {step < 3 ? (
              <Button disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)} onClick={() => setStep((s) => s + 1)}>Siguiente</Button>
            ) : (
              <Button disabled={!pwValid || create.isPending} onClick={submit}>
                {create.isPending && <Loader2 size={18} className="animate-spin" />} Crear usuario
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
