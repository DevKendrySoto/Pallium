'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export interface PatientCategory {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  _count: { patients: number }
}

export interface CreateCategoryInput {
  code: string
  name: string
  description?: string
}

export interface UpdateCategoryInput {
  id: string
  name?: string
  description?: string
  isActive?: boolean
}

const KEY = ['patient-categories', 'all']

export function useCategories() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<PatientCategory[]>('/patient-categories/all') })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCategoryInput) => api.post<PatientCategory>('/patient-categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Categoría creada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo crear la categoría'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCategoryInput) => api.patch<PatientCategory>(`/patient-categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Categoría actualizada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la categoría'),
  })
}
