'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

function todayBounds() {
  const day = new Date().toISOString().slice(0, 10)
  return { from: `${day}T00:00:00.000Z`, to: `${day}T23:59:59.999Z` }
}

/** KPIs del dashboard: pacientes activos, visitas de hoy, alertas abiertas. */
export function useDashboardKpis() {
  const activePatients = useQuery({
    queryKey: ['kpi', 'active-patients'],
    queryFn: () => api.get<{ total: number }>('/patients?status=ACTIVE&pageSize=1'),
  })

  const visitsToday = useQuery({
    queryKey: ['kpi', 'visits-today'],
    queryFn: () => {
      const { from, to } = todayBounds()
      return api.get<{ total: number }>(`/visits?from=${from}&to=${to}&pageSize=1`)
    },
  })

  const openAlerts = useQuery({
    queryKey: ['kpi', 'open-alerts'],
    queryFn: () => api.get<unknown[]>('/alerts?status=OPEN'),
  })

  return {
    activePatients: activePatients.data?.total,
    visitsToday: visitsToday.data?.total,
    openAlerts: openAlerts.data?.length,
    isLoading: activePatients.isLoading || visitsToday.isLoading || openAlerts.isLoading,
    isError: activePatients.isError || visitsToday.isError || openAlerts.isError,
  }
}
