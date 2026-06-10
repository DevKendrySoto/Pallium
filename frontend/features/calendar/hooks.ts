'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { type CalendarResponse, calendarResponseSchema } from './types'

export const calendarKeys = {
  range: (from: string, to: string) => ['calendar', from, to] as const,
}

/** Cronograma de la semana [from, to] con polling cada 60s. */
export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: calendarKeys.range(from, to),
    queryFn: async (): Promise<CalendarResponse> =>
      calendarResponseSchema.parse(await api.get(`/v1/appointments/calendar?from=${from}&to=${to}`)),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

function useInvalidateCalendar() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['calendar'] })
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidateCalendar()
  return useMutation({
    mutationFn: ({ id, scheduledDate, reason }: { id: string; scheduledDate: string; reason?: string }) =>
      api.patch(`/visits/${id}/reschedule`, { scheduledDate, reason }),
    onSuccess: () => invalidate(),
  })
}

export function useCancelAppointment() {
  const invalidate = useInvalidateCalendar()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/visits/${id}/cancel`, { reason }),
    onSuccess: () => invalidate(),
  })
}
