'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PatientCombobox } from '@/components/visits/patient-combobox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODALITY_LABELS, REASON_LABELS, TYPE_LABELS } from '@/features/visits/constants'
import { useCreateVisit } from '@/features/visits/hooks'
import { useReadOnly } from '@/hooks/use-read-only'

const schema = z
  .object({
    patientId: z.string().min(1, 'Selecciona un paciente'),
    type: z.enum(['REGULAR', 'EXTRAORDINARY']),
    reason: z
      .enum(['EMERGENCY', 'ANTIBIOTIC_THERAPY', 'SPECIAL_FOLLOWUP', 'WOUND_CARE'])
      .optional(),
    modality: z.enum(['HOME', 'CLINIC', 'TELEHEALTH']),
    scheduledDate: z.string().min(1, 'Requerida'),
  })
  .refine((d) => d.type !== 'EXTRAORDINARY' || Boolean(d.reason), {
    message: 'Selecciona un motivo',
    path: ['reason'],
  })

type FormValues = z.infer<typeof schema>

export function CreateVisitDialog({ defaultDateTime }: { defaultDateTime?: string }) {
  const [open, setOpen] = useState(false)
  const readOnly = useReadOnly()
  const createVisit = useCreateVisit()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: '',
      type: 'REGULAR',
      modality: 'HOME',
      scheduledDate: defaultDateTime ?? '',
    },
  })

  const type = form.watch('type')

  function onSubmit(values: FormValues) {
    createVisit.mutate(
      {
        patientId: values.patientId,
        type: values.type,
        modality: values.modality,
        scheduledDate: new Date(values.scheduledDate).toISOString(),
        ...(values.type === 'EXTRAORDINARY' && values.reason ? { reason: values.reason } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false)
          form.reset({ ...form.getValues(), patientId: '' })
        },
      },
    )
  }

  if (readOnly) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={18} />
          Agendar visita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar visita</DialogTitle>
          <DialogDescription>Programa una visita regular o extraordinaria.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <PatientCombobox value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {type === 'EXTRAORDINARY' && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un motivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(REASON_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createVisit.isPending}>
                {createVisit.isPending && <Loader2 size={18} className="animate-spin" />}
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
