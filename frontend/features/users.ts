'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type {
  ManagedUser,
  RoleInfo,
  UserActivityItem,
  UserDetail,
  UserSession,
} from '@/types/user'

interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

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
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user', vars.id] })
      toast.success('Usuario actualizado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo actualizar'),
  })
}

// ===== Gestión avanzada (Fase 2) =====

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<UserDetail>(`/v1/users/${id}`),
    enabled: Boolean(id),
  })
}

export function useAdminCount() {
  return useQuery({
    queryKey: ['admin-count'],
    queryFn: () => api.get<{ activeAdmins: number }>('/v1/users/admin-count'),
    staleTime: 60 * 1000,
  })
}

export function useUserSessions(id: string) {
  return useQuery({
    queryKey: ['user-sessions', id],
    queryFn: () => api.get<UserSession[]>(`/v1/users/${id}/sessions`),
    enabled: Boolean(id),
  })
}

export function useRevokeSession(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/v1/users/${userId}/sessions/${sessionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-sessions', userId] })
      toast.success('Sesión revocada')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo revocar'),
  })
}

export function useRevokeAllSessions(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/v1/users/${userId}/sessions`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-sessions', userId] })
      toast.success('Sesiones revocadas')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo revocar'),
  })
}

export function useUserActivity(id: string, page: number, action?: string) {
  return useQuery({
    queryKey: ['user-activity', id, page, action ?? null],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (action) p.set('action', action)
      return api.get<Paginated<UserActivityItem>>(`/v1/users/${id}/activity?${p.toString()}`)
    },
    enabled: Boolean(id),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/users/${id}/activate`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user', id] })
      toast.success('Usuario reactivado')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'No se pudo reactivar'),
  })
}

export interface ResetPasswordResult {
  temporaryPassword: string
  mustChangePassword: boolean
}
export function useResetPassword(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => api.post<ResetPasswordResult>(`/v1/users/${userId}/reset-password`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-sessions', userId] }),
  })
}

export interface DeactivateInput {
  reason: string
  reassignFutureAppointments: 'bulk' | 'unassigned'
  appointmentsReassignTo?: string
  reassignFutureRoutes: 'bulk' | 'unassigned'
  routesReassignTo?: string
  notifyCoordinator: boolean
}
export interface DeactivateResult {
  patientsReassigned: number
  appointmentsReassigned: number
  routesReassigned: number
  alertsCreated: number
}
export function useDeactivateUser(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DeactivateInput) => api.post<DeactivateResult>(`/v1/users/${userId}/deactivate`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user', userId] })
    },
  })
}

// ===== Perfil propio =====

export interface UpdateMeInput {
  fullName?: string
  phone?: string
  currentPassword?: string
  newPassword?: string
}
export function useUpdateMe() {
  return useMutation({
    mutationFn: (body: UpdateMeInput) =>
      api.patch<{ id: string; fullName: string; phone: string | null; mustChangePassword: boolean }>('/v1/users/me', body),
  })
}

export function useMySessions() {
  return useQuery({ queryKey: ['my-sessions'], queryFn: () => api.get<UserSession[]>('/v1/users/me/sessions') })
}

export function useRevokeMySession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/v1/users/me/sessions/${sessionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
      toast.success('Sesión revocada')
    },
  })
}

export function useRevokeMySessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/v1/users/me/sessions'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
      toast.success('Sesiones cerradas')
    },
  })
}
