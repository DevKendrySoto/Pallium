'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateDriver } from '@/features/routes/hooks'

const schema = z.object({
  fullName: z.string().min(3, 'Requerido'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Teléfono internacional, ej.: +18095551234'),
})

type FormValues = z.infer<typeof schema>

export function CreateDriverDialog({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const createDriver = useCreateDriver()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '' },
  })

  function onSubmit(values: FormValues) {
    createDriver.mutate(values, {
      onSuccess: (driver) => {
        setOpen(false)
        form.reset()
        onCreated?.(driver.id)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus size={16} />
          Nuevo chofer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo chofer</DialogTitle>
          <DialogDescription>Recibe la ruta por WhatsApp; no usa el sistema.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input placeholder="+18095551234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createDriver.isPending}>
                {createDriver.isPending && <Loader2 size={18} className="animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
