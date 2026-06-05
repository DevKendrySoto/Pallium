'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AuditEntry } from '@/types/user'

interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function useAudit(filters: { action?: string; entityType?: string; page?: number }) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType) params.set('entityType', filters.entityType)
      params.set('page', String(filters.page ?? 1))
      params.set('pageSize', '50')
      return api.get<Paginated<AuditEntry>>(`/audit?${params.toString()}`)
    },
  })
}
