'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Paginated, PatientOption, Visit } from './types'

export interface VisitFilters {
  from?: string
  to?: string
  type?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface CreateVisitInput {
  patientId: string
  type: string
  reason?: string
  modality: string
  scheduledDate: string
  durationMin?: number
}

function toQuery(filters: VisitFilters): string {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.type) params.set('type', filters.type)
  if (filters.status) params.set('status', filters.status)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))
  return params.toString()
}

export const visitKeys = {
  all: ['visits'] as const,
  list: (filters: VisitFilters) => ['visits', 'list', filters] as const,
}

export function useVisits(filters: VisitFilters) {
  return useQuery({
    queryKey: visitKeys.list(filters),
    queryFn: () => api.get<Paginated<Visit>>(`/visits?${toQuery(filters)}`),
  })
}

/** Búsqueda de pacientes para el alta de visita (autocontenida). */
export function usePatientSearch(search: string) {
  return useQuery({
    queryKey: ['visits', 'patient-search', search],
    queryFn: () =>
      api.get<Paginated<PatientOption>>(
        `/patients?pageSize=10${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      ),
    enabled: search.length === 0 || search.length >= 2,
  })
}

export function useCreateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVisitInput) => api.post<Visit>('/visits', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitKeys.all })
      toast.success('Visita agendada')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo agendar'),
  })
}

export function useCompleteVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Visit>(`/visits/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitKeys.all })
      toast.success('Visita marcada como realizada')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo completar'),
  })
}

export function useCancelVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch<Visit>(`/visits/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitKeys.all })
      toast.success('Visita cancelada')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo cancelar'),
  })
}
