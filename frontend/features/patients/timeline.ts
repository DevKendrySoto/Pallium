'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TimelineEvent } from '@/types/timeline'

export function usePatientTimeline(id: string) {
  return useQuery({
    queryKey: ['patients', 'timeline', id],
    queryFn: () => api.get<TimelineEvent[]>(`/patients/${id}/timeline`),
    enabled: Boolean(id),
  })
}
