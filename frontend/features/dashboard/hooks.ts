'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { type DashboardResponse, dashboardResponseSchema } from './types'

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
