'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { TemplateSection } from '@/types/clinical'

export type Specialty = 'MEDICINE' | 'NURSING' | 'PSYCHOLOGY' | 'SOCIAL_WORK' | 'PHYSIOTHERAPY'

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  MEDICINE: 'Medicina',
  NURSING: 'Enfermería',
  PSYCHOLOGY: 'Psicología',
  SOCIAL_WORK: 'Trabajo social',
  PHYSIOTHERAPY: 'Fisiatría',
}

export interface ClinicalTemplateAdmin {
  id: string
  key: string
  name: string
  specialty: Specialty | null
  categoryCode: string | null
  version: number
  sections: TemplateSection[]
  isActive: boolean
}

export interface CreateTemplateInput {
  key: string
  name: string
  specialty?: Specialty | null
  categoryCode?: string | null
  sections: TemplateSection[]
}

export interface UpdateTemplateInput {
  key: string
  name?: string
  specialty?: Specialty | null
  categoryCode?: string | null
  isActive?: boolean
  sections?: TemplateSection[]
}

const KEY = ['clinical-templates', 'all']

export function useAllTemplates() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<ClinicalTemplateAdmin[]>('/clinical-templates/all') })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTemplateInput) => api.post<ClinicalTemplateAdmin>('/clinical-templates', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Plantilla creada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo crear la plantilla'),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, ...body }: UpdateTemplateInput) => api.patch<ClinicalTemplateAdmin>(`/clinical-templates/${key}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Plantilla actualizada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la plantilla'),
  })
}
