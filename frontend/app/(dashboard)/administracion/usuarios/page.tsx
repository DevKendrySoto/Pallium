'use client'

import { Loader2, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { RoleBadge } from '@/components/users/role-badge'
import { UserAvatar } from '@/components/users/user-avatar'
import { CopyToClipboard } from '@/components/users/copy-to-clipboard'
import { PasswordStrengthMeter, passwordScore } from '@/components/users/password-strength-meter'
import { roleMeta } from '@/components/users/role-meta'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useActivateUser, useCreateUser, useRoles, useUsers } from '@/features/users'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const LAST_LOGIN = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'older', label: '+30 días' },
  { key: 'never', label: 'Nunca' },
]

function relative(iso: string | null): string {
  if (!iso) return 'Nunca'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 30) return `hace ${days} d`
  return new Date(iso).toLocaleDateString('es')
}
function lastLoginBucket(iso: string | null): string {
  if (!iso) return 'never'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days <= 7) return '7d'
  if (days <= 30) return '30d'
  return 'older'
}
function toggle(s: Set<string>, v: string) {
  const n = new Set(s)
  n.has(v) ? n.delete(v) : n.add(v)
  return n
}

export default function UsersListPage() {
  const { data, isLoading, isError } = useUsers()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loginFilter, setLoginFilter] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const activate = useActivateUser()

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.toLowerCase()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const filtered = useMemo(() => {
    return (data ?? []).filter((u) => {
      if (search && !`${u.fullName} ${u.email}`.toLowerCase().includes(search)) return false
      if (roleFilter.size && !u.roles.some((r) => roleFilter.has(r.code))) return false
      if (statusFilter === 'active' && !u.isActive) return false
      if (statusFilter === 'inactive' && u.isActive) return false
      if (loginFilter.size && !loginFilter.has(lastLoginBucket(u.lastLoginAt))) return false
      return true
    })
  }, [data, search, roleFilter, statusFilter, loginFilter])

  const roleCodes = useMemo(() => [...new Set((data ?? []).flatMap((u) => u.roles.map((r) => r.code)))], [data])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios y roles</h1>
          <p className="text-sm text-muted-foreground">Gestión del personal del sistema.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={18} /> Nuevo usuario</Button>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input className="pl-8 sm:max-w-xs" placeholder="Buscar por nombre o correo…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Rol</span>
          {roleCodes.map((c) => (
            <button key={c} type="button" onClick={() => { setRoleFilter(toggle(roleFilter, c)); setPage(1) }}
              className={cn('min-h-8 rounded-md border px-2.5 text-xs', roleFilter.has(c) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
              {roleMeta(c).label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn('min-h-8 rounded-md border px-2.5 text-xs', statusFilter === s ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
              {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
          <span className="ml-2 text-xs font-medium text-muted-foreground">Último login</span>
          {LAST_LOGIN.map((l) => (
            <button key={l.key} type="button" onClick={() => { setLoginFilter(toggle(loginFilter, l.key)); setPage(1) }}
              className={cn('min-h-8 rounded-md border px-2.5 text-xs', loginFilter.has(l.key) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700')}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último login</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {isError && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-danger">No se pudieron cargar los usuarios.</TableCell></TableRow>}
            {!isLoading && pageItems.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Ningún usuario coincide con los filtros.</TableCell></TableRow>
            )}
            {pageItems.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.fullName} roleCode={u.roles[0]?.code} size="sm" />
                    <div className="min-w-0">
                      <Link href={`/administracion/usuarios/${u.id}`} className="font-medium hover:underline">{u.fullName}</Link>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{u.roles.map((r) => <RoleBadge key={r.code} code={r.code} />)}</div></TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('font-medium', u.isActive ? 'border-transparent bg-success text-success-foreground' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{relative(u.lastLoginAt)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm"><Link href={`/administracion/usuarios/${u.id}`}>Detalle</Link></Button>
                    {!u.isActive && (
                      <Button variant="outline" size="sm" disabled={activate.isPending} onClick={() => activate.mutate(u.id)}>Reactivar</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} usuarios</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function genTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `P${s}#7`
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const roles = useRoles()
  const create = useCreateUser()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [password, setPassword] = useState(genTempPassword())
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)

  const valid = email && fullName.length >= 3 && roleCode && passwordScore(password).score === 4

  function submit() {
    if (!valid) return
    create.mutate(
      { email, fullName, password, roleCodes: [roleCode] },
      {
        onSuccess: () => {
          setCreated({ email, password })
          setEmail(''); setFullName(''); setRoleCode(''); setPassword(genTempPassword())
        },
      },
    )
  }

  return (
    <>
      <Dialog open={open && !created} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Crea una cuenta y asigna su rol.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Correo</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
                <option value="">Selecciona un rol</option>
                {roles.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Contraseña temporal</Label>
                <Button variant="ghost" size="sm" onClick={() => setPassword(genTempPassword())}>Generar otra</Button>
              </div>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
              <PasswordStrengthMeter value={password} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!valid || create.isPending} onClick={submit}>
              {create.isPending && <Loader2 size={18} className="animate-spin" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={created !== null} onOpenChange={(o) => { if (!o) { setCreated(null); onOpenChange(false) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Credenciales del usuario</DialogTitle>
            <DialogDescription>Estas credenciales no se mostrarán de nuevo. Compártalas por canal seguro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
            <p><span className="text-muted-foreground">Correo:</span> {created?.email}</p>
            <p><span className="text-muted-foreground">Contraseña:</span> <span className="font-mono">{created?.password}</span></p>
            <CopyToClipboard value={`${created?.email}\n${created?.password}`} label="Copiar todo" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreated(null); onOpenChange(false) }}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
