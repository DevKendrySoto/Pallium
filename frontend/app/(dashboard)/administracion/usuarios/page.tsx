'use client'

import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { RoleBadge } from '@/components/users/role-badge'
import { UserAvatar } from '@/components/users/user-avatar'
import { roleMeta } from '@/components/users/role-meta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useActivateUser, useUsers } from '@/features/users'
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
  if (n.has(v)) n.delete(v)
  else n.add(v)
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
        <Button asChild><Link href="/administracion/usuarios/nuevo"><Plus size={18} /> Nuevo usuario</Link></Button>
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

    </div>
  )
}
