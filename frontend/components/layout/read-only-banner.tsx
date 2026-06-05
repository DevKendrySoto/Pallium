'use client'

import { Eye } from 'lucide-react'
import { useReadOnly } from '@/hooks/use-read-only'

/** Banner permanente para roles de solo lectura (Auditor). */
export function ReadOnlyBanner() {
  const readOnly = useReadOnly()
  if (!readOnly) return null
  return (
    <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-warning/15 px-4 py-1.5 text-sm text-amber-800">
      <Eye size={16} />
      Modo solo lectura — no puedes realizar cambios.
    </div>
  )
}
