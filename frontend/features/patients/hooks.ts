'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Paginated, Patient, PatientCategory, PatientStatus } from '@/types/patient'

export interface PatientFilters {
  search?: string
  status?: PatientStatus
  categoryId?: string
  page?: number
  pageSize?: number
}

export interface CreatePatientInput {
  identificationType: string
  identificationNo: string
  firstName: string
  lastName: string
  birthDate: string
  sex: string
  categoryId: string
  phone?: string
  email?: string
}

function toQuery(filters: PatientFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 20))
  return params.toString()
}

export const patientKeys = {
  all: ['patients'] as const,
  list: (filters: PatientFilters) => ['patients', 'list', filters] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
}

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: () => api.get<Paginated<Patient>>(`/patients?${toQuery(filters)}`),
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => api.get<Patient>(`/patients/${id}`),
    enabled: Boolean(id),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['patient-categories'],
    queryFn: () => api.get<PatientCategory[]>('/patient-categories'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePatientInput) => api.post<Patient>('/patients', input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: patientKeys.all })
      toast.success(`Paciente registrado (${patient.mrn})`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo registrar'),
  })
}

export interface ChangeStatusInput {
  id: string
  status: PatientStatus
  reason?: string
  /** Obligatorios cuando status = DECEASED. */
  deathDate?: string
  deathPlace?: string
}

export function useChangePatientStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: ChangeStatusInput) =>
      api.patch<Patient>(`/patients/${id}/status`, body),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: patientKeys.all })
      qc.invalidateQueries({ queryKey: patientKeys.detail(patient.id) })
      toast.success('Estado actualizado')
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado'),
  })
}
