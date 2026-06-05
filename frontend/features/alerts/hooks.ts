'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Alert, AlertSeverity, AlertStatus, AlertType } from '@/types/alert'

export interface AlertFilters {
  status?: AlertStatus
  severity?: AlertSeverity
  type?: AlertType
  patientId?: string
}

function toQuery(filters: AlertFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.type) params.set('type', filters.type)
  if (filters.patientId) params.set('patientId', filters.patientId)
  return params.toString()
}

export const alertKeys = {
  all: ['alerts'] as const,
  list: (filters: AlertFilters) => ['alerts', 'list', filters] as const,
}

export function useAlerts(filters: AlertFilters) {
  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: () => {
      const qs = toQuery(filters)
      return api.get<Alert[]>(`/alerts${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Alert>(`/alerts/${id}/acknowledge`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alertKeys.all })
      toast.success('Alerta reconocida')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo reconocer'),
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Alert>(`/alerts/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: alertKeys.all })
      toast.success('Alerta resuelta')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo resolver'),
  })
}
