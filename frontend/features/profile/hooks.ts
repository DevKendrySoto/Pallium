'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { AdvanceDirective, Allergy, Habit, MedicalHistory } from '@/types/profile'

function useInvalidate(patientId: string, key: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['profile', patientId, key] })
}

// ---- Alergias ----
export function useAllergies(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'allergies'],
    queryFn: () => api.get<Allergy[]>(`/patients/${patientId}/allergies`),
    enabled: Boolean(patientId),
  })
}
export function useCreateAllergy(patientId: string) {
  const invalidate = useInvalidate(patientId, 'allergies')
  return useMutation({
    mutationFn: (body: Partial<Allergy>) => api.post(`/patients/${patientId}/allergies`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Alergia registrada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
export function useDeleteAllergy(patientId: string) {
  const invalidate = useInvalidate(patientId, 'allergies')
  return useMutation({
    mutationFn: (id: string) => api.delete(`/allergies/${id}`),
    onSuccess: invalidate,
  })
}

// ---- Antecedentes ----
export function useHistory(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'history'],
    queryFn: () => api.get<MedicalHistory[]>(`/patients/${patientId}/medical-history`),
    enabled: Boolean(patientId),
  })
}
export function useCreateHistory(patientId: string) {
  const invalidate = useInvalidate(patientId, 'history')
  return useMutation({
    mutationFn: (body: Partial<MedicalHistory>) =>
      api.post(`/patients/${patientId}/medical-history`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Antecedente registrado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
export function useDeleteHistory(patientId: string) {
  const invalidate = useInvalidate(patientId, 'history')
  return useMutation({
    mutationFn: (id: string) => api.delete(`/medical-history/${id}`),
    onSuccess: invalidate,
  })
}

// ---- Hábitos (upsert por tipo) ----
export function useHabits(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'habits'],
    queryFn: () => api.get<Habit[]>(`/patients/${patientId}/habits`),
    enabled: Boolean(patientId),
  })
}
export function useUpsertHabit(patientId: string) {
  const invalidate = useInvalidate(patientId, 'habits')
  return useMutation({
    mutationFn: (body: Partial<Habit>) => api.put(`/patients/${patientId}/habits`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Hábito actualizado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}

// ---- Voluntades anticipadas (1:1) ----
export function useDirective(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'directive'],
    queryFn: () => api.get<AdvanceDirective | null>(`/patients/${patientId}/advance-directive`),
    enabled: Boolean(patientId),
  })
}
export function useUpsertDirective(patientId: string) {
  const invalidate = useInvalidate(patientId, 'directive')
  return useMutation({
    mutationFn: (body: Partial<AdvanceDirective> & { sign?: boolean }) =>
      api.put(`/patients/${patientId}/advance-directive`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Voluntades anticipadas guardadas')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
