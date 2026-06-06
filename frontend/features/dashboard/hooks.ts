'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { type DashboardResponse, dashboardResponseSchema } from './types'

/** Rol clínico → especialidad de la nota que registra. */
const ROLE_SPECIALTY: Record<string, string> = {
  MEDICO: 'MEDICINE',
  COORDINADOR_MEDICO: 'MEDICINE',
  ENFERMERIA: 'NURSING',
  PSICOLOGIA: 'PSYCHOLOGY',
  TRABAJO_SOCIAL: 'SOCIAL_WORK',
  FISIATRA: 'PHYSIOTHERAPY',
}

export const dashboardKeys = {
  me: ['dashboard', 'me'] as const,
}

/** Dashboard del usuario actual con polling cada 60s. */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.me,
    queryFn: async (): Promise<DashboardResponse> =>
      dashboardResponseSchema.parse(await api.get('/v1/dashboard/me')),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export interface OutcomeResult {
  outcome: string
  visitId: string
  status: string
  refusalCount?: number
  nextVisitId?: string
  consideredPassive?: boolean
}

function useInvalidateDashboard() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: dashboardKeys.me })
}

/** Registra el resultado de una visita (POST /v1/visits/:id/outcome). */
export function useVisitOutcome() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({ id, outcome, reason }: { id: string; outcome: string; reason?: string }) =>
      api.post<OutcomeResult>(`/v1/visits/${id}/outcome`, { outcome, reason }),
    onSuccess: () => invalidate(),
  })
}

/** "Iniciar visita": guarda un registro mínimo de la especialidad del usuario y completa la visita. */
export function useStartVisitComplete() {
  const invalidate = useInvalidateDashboard()
  // Selecciona la referencia estable (no crear array nuevo en el selector → evita loop).
  const roles = useAuthStore((s) => s.user?.roles)
  const specialty = (roles ?? []).map((r) => ROLE_SPECIALTY[r]).find(Boolean) ?? 'NURSING'
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await api.post(`/visits/${id}/clinical-record`, {
        specialty,
        summary: note.slice(0, 120),
        data: { nota: note },
      })
      return api.post<OutcomeResult>(`/v1/visits/${id}/outcome`, { outcome: 'COMPLETED' })
    },
    onSuccess: () => invalidate(),
  })
}

/** Reprograma una visita (PATCH /visits/:id/reschedule). */
export function useRescheduleVisit() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({ id, scheduledDate, reason }: { id: string; scheduledDate: string; reason?: string }) =>
      api.patch(`/visits/${id}/reschedule`, { scheduledDate, reason }),
    onSuccess: () => invalidate(),
  })
}

/** Confirma una visita agendada (PATCH /visits/:id/transition → CONFIRMED). */
export function useConfirmVisit() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.patch(`/visits/${id}/transition`, { status: 'CONFIRMED' }),
    onSuccess: () => invalidate(),
  })
}

/** Despacha una ruta al chofer por WhatsApp (POST /routes/:id/dispatch). */
export function useDispatchRouteFromDashboard() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.post(`/routes/${id}/dispatch`),
    onSuccess: () => invalidate(),
  })
}
