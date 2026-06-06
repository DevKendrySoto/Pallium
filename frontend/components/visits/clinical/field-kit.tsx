'use client'

import { cn } from '@/lib/utils'

/** Chip seleccionable (evita selects para pocas opciones). Reutilizable. */
export function Choice({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-9 rounded-md border px-3 text-sm',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )
}

/** Área de texto simple con estilo consistente. */
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-20 w-full rounded-md border border-slate-200 p-2 text-base focus:outline-none focus:ring-1 focus:ring-primary"
    />
  )
}
