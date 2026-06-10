'use client'

import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function PlaceholderScreen({
  title,
  phase,
  description,
}: {
  title: string
  phase: number
  description: string
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Esta sección se implementará en la fase {phase} del roadmap.
        </p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="flex items-start gap-3 pt-6">
          <Construction size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
