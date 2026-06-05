'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type {
  AdvanceDirective,
  Allergy,
  Caregiver,
  FamilyMember,
  Habit,
  Immunization,
  MedicalHistory,
  SocialProfile,
} from '@/types/profile'

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

// ---- Cuidadores (Fase 2) ----
export function useCaregivers(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'caregivers'],
    queryFn: () => api.get<Caregiver[]>(`/patients/${patientId}/caregivers`),
    enabled: Boolean(patientId),
  })
}
export function useCreateCaregiver(patientId: string) {
  const invalidate = useInvalidate(patientId, 'caregivers')
  return useMutation({
    mutationFn: (body: Partial<Caregiver>) => api.post(`/patients/${patientId}/caregivers`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Cuidador agregado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
export function useDeleteCaregiver(patientId: string) {
  const invalidate = useInvalidate(patientId, 'caregivers')
  return useMutation({ mutationFn: (id: string) => api.delete(`/caregivers/${id}`), onSuccess: invalidate })
}

// ---- Familia (Fase 2) ----
export function useFamily(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'family'],
    queryFn: () => api.get<FamilyMember[]>(`/patients/${patientId}/family-members`),
    enabled: Boolean(patientId),
  })
}
export function useCreateFamilyMember(patientId: string) {
  const invalidate = useInvalidate(patientId, 'family')
  return useMutation({
    mutationFn: (body: Partial<FamilyMember>) => api.post(`/patients/${patientId}/family-members`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Familiar agregado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
export function useDeleteFamilyMember(patientId: string) {
  const invalidate = useInvalidate(patientId, 'family')
  return useMutation({ mutationFn: (id: string) => api.delete(`/family-members/${id}`), onSuccess: invalidate })
}

// ---- Perfil social (Fase 2, 1:1) ----
export function useSocialProfile(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'social'],
    queryFn: () => api.get<SocialProfile | null>(`/patients/${patientId}/social-profile`),
    enabled: Boolean(patientId),
  })
}
export function useUpsertSocialProfile(patientId: string) {
  const invalidate = useInvalidate(patientId, 'social')
  return useMutation({
    mutationFn: (body: Partial<SocialProfile>) => api.put(`/patients/${patientId}/social-profile`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Perfil social guardado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}

// ---- Inmunizaciones (Fase 2) ----
export function useImmunizations(patientId: string) {
  return useQuery({
    queryKey: ['profile', patientId, 'immunizations'],
    queryFn: () => api.get<Immunization[]>(`/patients/${patientId}/immunizations`),
    enabled: Boolean(patientId),
  })
}
export function useCreateImmunization(patientId: string) {
  const invalidate = useInvalidate(patientId, 'immunizations')
  return useMutation({
    mutationFn: (body: Partial<Immunization>) => api.post(`/patients/${patientId}/immunizations`, body),
    onSuccess: () => {
      invalidate()
      toast.success('Inmunización registrada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error'),
  })
}
export function useDeleteImmunization(patientId: string) {
  const invalidate = useInvalidate(patientId, 'immunizations')
  return useMutation({ mutationFn: (id: string) => api.delete(`/immunizations/${id}`), onSuccess: invalidate })
}
