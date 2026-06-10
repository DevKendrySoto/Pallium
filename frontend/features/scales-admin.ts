'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export type ScaleCategory =
  | 'FUNCTIONAL'
  | 'PROGNOSTIC'
  | 'SYMPTOM'
  | 'PAIN'
  | 'NUTRITIONAL'
  | 'PSYCHOSOCIAL'
  | 'COGNITIVE'
  | 'QUALITY_OF_LIFE'
  | 'CAREGIVER'
  | 'COMPLEXITY'

export interface ScaleAdmin {
  id: string
  code: string
  name: string
  category: ScaleCategory
  description: string | null
  schema: Record<string, unknown>
  alertRule: Record<string, unknown> | null
  isActive: boolean
  _count: { assessments: number }
}

export interface CreateScaleInput {
  code: string
  name: string
  category: ScaleCategory
  description?: string
  schema: Record<string, unknown>
  alertRule?: Record<string, unknown> | null
}

export interface UpdateScaleInput {
  code: string
  name?: string
  category?: ScaleCategory
  description?: string
  isActive?: boolean
  schema?: Record<string, unknown>
  alertRule?: Record<string, unknown> | null
}

const KEY = ['scales', 'all']

export function useAllScales() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<ScaleAdmin[]>('/scales/all') })
}

export function useCreateScale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateScaleInput) => api.post<ScaleAdmin>('/scales', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Escala creada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo crear la escala'),
  })
}

export function useUpdateScale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, ...body }: UpdateScaleInput) => api.patch<ScaleAdmin>(`/scales/${code}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Escala actualizada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la escala'),
  })
}

export const SCALE_CATEGORY_LABELS: Record<ScaleCategory, string> = {
  FUNCTIONAL: 'Funcional',
  PROGNOSTIC: 'Pronóstica',
  SYMPTOM: 'Síntomas',
  PAIN: 'Dolor',
  NUTRITIONAL: 'Nutricional',
  PSYCHOSOCIAL: 'Psicosocial',
  COGNITIVE: 'Cognitiva',
  QUALITY_OF_LIFE: 'Calidad de vida',
  CAREGIVER: 'Cuidador',
  COMPLEXITY: 'Complejidad',
}
