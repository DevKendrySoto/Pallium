'use client'

import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCreateUser, useRoles, useUpdateUser, useUsers } from '@/features/users'
import { useReadOnly } from '@/hooks/use-read-only'
import { cn } from '@/lib/utils'

function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const roles = useRoles()
  const create = useCreateUser()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [roleCodes, setRoleCodes] = useState<string[]>([])

  const valid = email && fullName && password.length >= 8 && roleCodes.length > 0

  function add() {
    if (!valid) return
    create.mutate(
      { email, fullName, password, roleCodes },
      {
        onSuccess: () => {
          setOpen(false)
          setEmail('')
          setFullName('')
          setPassword('')
          setRoleCodes([])
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={18} /> Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>Crea una cuenta y asigna sus roles.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Correo</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Contraseña (mín. 8)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {roles.data?.map((r) => {
                const active = roleCodes.includes(r.code)
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() =>
                      setRoleCodes(active ? roleCodes.filter((c) => c !== r.code) : [...roleCodes, r.code])
                    }
                    className={cn(
                      'min-h-9 rounded-md border px-3 text-sm',
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700',
                    )}
                  >
                    {r.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={add} disabled={!valid || create.isPending}>
            {create.isPending && <Loader2 size={18} className="animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const readOnly = useReadOnly()
  const { data, isLoading, isError } = useUsers()
  const update = useUpdateUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Cuentas del personal y sus roles.</p>
        </div>
        {!readOnly && <CreateUserDialog />}
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              {!readOnly && <TableHead className="w-28" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-danger">
                  No se pudieron cargar los usuarios.
                </TableCell>
              </TableRow>
            )}
            {data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {u.roles.map((r) => r.name).join(', ')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-medium',
                      u.isActive
                        ? 'border-transparent bg-success text-success-foreground'
                        : 'border-slate-200 bg-slate-100 text-slate-600',
                    )}
                  >
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: u.id, isActive: !u.isActive })}
                    >
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
