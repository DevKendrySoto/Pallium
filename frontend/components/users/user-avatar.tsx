'use client'

import { cn } from '@/lib/utils'
import { initials, roleMeta } from './role-meta'

export function UserAvatar({
  name,
  roleCode,
  size = 'md',
}: {
  name: string
  roleCode?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full font-medium text-white', dim, roleMeta(roleCode ?? '').bg)}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
