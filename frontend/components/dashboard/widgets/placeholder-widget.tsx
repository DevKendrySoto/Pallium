'use client'

import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { placeholderDataSchema } from '@/features/dashboard/types'

export function PlaceholderWidget({ data }: { data: unknown }) {
  const parsed = placeholderDataSchema.safeParse(data)
  const message = parsed.success ? parsed.data.message : 'Dashboard en construcción'
  return (
    <Card className="border-slate-200">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <Construction className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
