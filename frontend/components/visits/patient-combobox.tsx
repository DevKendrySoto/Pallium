'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { usePatientSearch } from '@/features/visits/hooks'

interface Props {
  value: string
  onChange: (patientId: string) => void
}

export function PatientCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [label, setLabel] = useState<string | null>(null)
  const { data, isFetching } = usePatientSearch(search)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!label && 'text-muted-foreground')}>
            {label ?? 'Selecciona un paciente'}
          </span>
          <ChevronsUpDown size={16} className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por nombre o id…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{isFetching ? 'Buscando…' : 'Sin resultados'}</CommandEmpty>
            {data?.items.map((p) => (
              <CommandItem
                key={p.id}
                value={p.id}
                onSelect={() => {
                  onChange(p.id)
                  setLabel(`${p.firstName} ${p.lastName} · ${p.mrn}`)
                  setOpen(false)
                }}
              >
                <Check size={16} className={cn(value === p.id ? 'opacity-100' : 'opacity-0')} />
                <span>
                  {p.firstName} {p.lastName}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{p.mrn}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
