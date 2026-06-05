'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ScaleDefinition } from '@/types/clinical'

export function useScaleDefinition(code: string) {
  return useQuery({
    queryKey: ['scale-def', code],
    queryFn: () => api.get<ScaleDefinition>(`/scales/${code}`),
    enabled: Boolean(code),
    staleTime: 10 * 60 * 1000,
  })
}

export interface AssessResult {
  assessment: { id: string; score: number | null; interpretation: string | null }
  alert: { severity: string; title: string } | null
}

export function useAssessScale() {
  return useMutation({
    mutationFn: (body: {
      patientId: string
      scaleCode: string
      visitId?: string
      items: Record<string, unknown>
    }) => api.post<AssessResult>('/scales/assess', body),
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo aplicar la escala'),
  })
}
