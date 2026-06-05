'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ManagedUser, RoleInfo } from '@/types/user'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => api.get<ManagedUser[]>('/users') })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<RoleInfo[]>('/roles'),
    staleTime: 10 * 60 * 1000,
  })
}

export interface CreateUserInput {
  email: string
  fullName: string
  password: string
  roleCodes: string[]
  specialty?: string
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserInput) => api.post<ManagedUser>('/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario creado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo crear el usuario'),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; isActive?: boolean; fullName?: string; roleCodes?: string[] }) =>
      api.patch<ManagedUser>(`/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario actualizado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar'),
  })
}
