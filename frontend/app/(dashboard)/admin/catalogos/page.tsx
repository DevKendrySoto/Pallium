'use client'

import { Construction, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type PatientCategory,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '@/features/catalogs'
import { cn } from '@/lib/utils'

export default function CatalogsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogos</h1>
        <p className="text-sm text-muted-foreground">Valores maestros usados en toda la operación.</p>
      </div>

      <Tabs defaultValue="categorias">
        <TabsList>
          <TabsTrigger value="categorias">Categorías de paciente</TabsTrigger>
          <TabsTrigger value="otros">Otros catálogos</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="pt-4">
          <CategoriesPanel />
        </TabsContent>

        <TabsContent value="otros" className="pt-4">
          <Card className="border-slate-200">
            <CardContent className="flex items-start gap-3 pt-6">
              <Construction size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Más catálogos (zonas, motivos y otros valores maestros) se irán habilitando aquí a medida que la operación los requiera.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CategoriesPanel() {
  const { data, isLoading, isError } = useCategories()
  const update = useUpdateCategory()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<PatientCategory | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}><Plus size={18} /> Nueva categoría</Button>
      </div>

      <div className="rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Pacientes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {isError && <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-danger">No se pudieron cargar las categorías.</TableCell></TableRow>}
            {!isLoading && data?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Aún no hay categorías. Crea la primera.</TableCell></TableRow>
            )}
            {data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{c.description || '—'}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{c._count.patients}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('font-medium', c.isActive ? 'border-transparent bg-success text-success-foreground' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                    {c.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(c)}>Editar</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: c.id, isActive: !c.isActive })}
                    >
                      {c.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CategoryDialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null) }} category={editing} />
    </div>
  )
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  category?: PatientCategory | null
}) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const isEdit = Boolean(category)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // Sincronizamos los campos con la categoría en edición cada vez que cambia.
  const [boundId, setBoundId] = useState<string | null>(null)
  if (open && (category?.id ?? null) !== boundId) {
    setBoundId(category?.id ?? null)
    setCode(category?.code ?? '')
    setName(category?.name ?? '')
    setDescription(category?.description ?? '')
  }

  const codeValid = isEdit || /^[A-Z0-9_]{2,40}$/.test(code)
  const valid = name.trim().length >= 3 && codeValid
  const pending = create.isPending || update.isPending

  function submit() {
    if (!valid) return
    const done = { onSuccess: () => onOpenChange(false) }
    if (isEdit && category) {
      update.mutate({ id: category.id, name: name.trim(), description: description.trim() || undefined }, done)
    } else {
      create.mutate({ code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined }, done)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'El código no se puede cambiar; identifica la categoría en todo el sistema.' : 'Define un código estable (mayúsculas) y un nombre legible.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Código</Label>
            <Input
              value={code}
              disabled={isEdit}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ONCO"
            />
            {!isEdit && code && !codeValid && <p className="text-xs text-danger">2–40 caracteres: mayúsculas, números o guion bajo.</p>}
          </div>
          <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Oncológico" /></div>
          <div className="space-y-1"><Label>Descripción <span className="text-muted-foreground">(opcional)</span></Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!valid || pending} onClick={submit}>
            {pending && <Loader2 size={18} className="animate-spin" />} {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
