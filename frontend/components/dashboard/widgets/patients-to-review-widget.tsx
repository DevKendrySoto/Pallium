'use client'

import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { patientsToReviewDataSchema } from '@/features/dashboard/types'

export function PatientsToReviewWidget({ data }: { data: unknown }) {
  const router = useRouter()
  const parsed = patientsToReviewDataSchema.safeParse(data)
  if (!parsed.success) return null
  const { patients, total } = parsed.data

  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Pacientes a revisar estado</h2>
          {total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>

        {patients.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay pacientes que requieran revisión.
          </p>
        ) : (
          <div className="space-y-2">
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/patients/${p.id}`)}
                className="flex w-full items-center gap-3 rounded-lg border border-l-4 border-slate-200 border-l-orange-500 p-3 text-left transition-colors hover:bg-slate-50"
              >
                <AlertTriangle size={18} className="shrink-0 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.mrn} · {p.reason}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
