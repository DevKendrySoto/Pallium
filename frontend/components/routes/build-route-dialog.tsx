'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { useBuildFromVisits } from '@/features/routes/hooks'

/** Arma una ruta con las visitas domiciliarias sin asignar del día elegido. */
export function BuildRouteDialog({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(defaultDate ?? '')
  const [name, setName] = useState('')
  const build = useBuildFromVisits()

  function onBuild() {
    if (!date) return
    build.mutate(
      { routeDate: date, name: name || undefined },
      {
        onSuccess: (route) => {
          setOpen(false)
          router.push(`/routes/${route.id}`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={18} />
          Armar ruta del día
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Armar ruta del día</DialogTitle>
          <DialogDescription>
            Agrupa las visitas domiciliarias sin asignar de la fecha elegida.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route-date">Fecha</Label>
            <Input
              id="route-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-name">Nombre (opcional)</Label>
            <Input
              id="route-name"
              placeholder="Ruta Norte"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onBuild} disabled={!date || build.isPending}>
            {build.isPending && <Loader2 size={18} className="animate-spin" />}
            Armar ruta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
