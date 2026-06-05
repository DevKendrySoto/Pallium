'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Role } from '@/types/auth'
import type {
  ClinicalRecordSections,
  ClinicalTemplate,
  VisitOutcome,
} from '@/types/clinical'
import type { Visit } from './types'

/** Mapea el rol del profesional a su especialidad clínica (para resolver la plantilla). */
export function roleToSpecialty(role: Role | null): string | null {
  switch (role) {
    case 'MEDICO':
      return 'MEDICINE'
    case 'ENFERMERIA':
      return 'NURSING'
    case 'PSICOLOGIA':
      return 'PSYCHOLOGY'
    case 'TRABAJO_SOCIAL':
      return 'SOCIAL_WORK'
    case 'FISIATRA':
      return 'PHYSIOTHERAPY'
    default:
      return null
  }
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: ['visit', id],
    queryFn: () => api.get<Visit>(`/visits/${id}`),
    enabled: Boolean(id),
  })
}

/** Resuelve la plantilla por rol×categoría, prefiriendo la más específica. */
export function useResolveTemplate(specialty: string | null, categoryCode?: string) {
  return useQuery({
    queryKey: ['clinical-template', specialty, categoryCode],
    enabled: Boolean(categoryCode),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (specialty) params.set('specialty', specialty)
      if (categoryCode) params.set('category', categoryCode)
      const list = await api.get<ClinicalTemplate[]>(`/clinical-templates?${params.toString()}`)
      // Preferir coincidencia exacta de categoría sobre la genérica (null).
      return (
        list.find((t) => t.categoryCode === categoryCode) ??
        list.find((t) => t.categoryCode === null) ??
        list[0] ??
        null
      )
    },
  })
}

export function useCheckIn(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (geo: { latitude?: number; longitude?: number }) =>
      api.post<Visit>(`/visits/${visitId}/check-in`, geo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit', visitId] })
      toast.success('Visita iniciada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo iniciar la visita'),
  })
}

export function useSaveClinicalRecord(visitId: string) {
  return useMutation({
    mutationFn: (body: {
      specialty: string
      templateKey?: string
      data: { sections: ClinicalRecordSections }
    }) => api.post(`/visits/${visitId}/clinical-record`, body),
  })
}

export function useCloseVisit(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { outcome: VisitOutcome; reason?: string }) =>
      api.post<Visit>(`/visits/${visitId}/close`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit', visitId] })
      toast.success('Visita cerrada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo cerrar la visita'),
  })
}

export function useSignVisit(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { storageKey: string; signerName: string }) =>
      api.post<Visit>(`/visits/${visitId}/signature`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit', visitId] })
      toast.success('Firma registrada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo registrar la firma'),
  })
}
