'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { roleMeta } from './role-meta'

export function RoleBadge({ code }: { code: string }) {
  const meta = roleMeta(code)
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium text-white', meta.bg)}>
      {meta.label}
    </Badge>
  )
}
