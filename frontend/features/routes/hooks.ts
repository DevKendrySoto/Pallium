'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Driver, RouteDetail, RouteListItem, RouteStatus } from './types'

export const routeKeys = {
  all: ['routes'] as const,
  list: (filters: { date?: string; status?: string }) => ['routes', 'list', filters] as const,
  detail: (id: string) => ['routes', 'detail', id] as const,
}

export function useRoutes(filters: { date?: string; status?: string }) {
  return useQuery({
    queryKey: routeKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.date) params.set('date', filters.date)
      if (filters.status) params.set('status', filters.status)
      const qs = params.toString()
      return api.get<RouteListItem[]>(`/routes${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: routeKeys.detail(id),
    queryFn: () => api.get<RouteDetail>(`/routes/${id}`),
    enabled: Boolean(id),
  })
}

export function useBuildFromVisits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { routeDate: string; name?: string; driverId?: string }) =>
      api.post<RouteDetail>('/routes/from-visits', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routeKeys.all })
      toast.success('Ruta armada con las visitas del día')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo armar la ruta'),
  })
}

/** Invalida el detalle y el listado tras una mutación sobre una ruta. */
function useRouteMutation<TArgs>(
  fn: (args: TArgs) => Promise<RouteDetail>,
  successMessage: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (route) => {
      qc.invalidateQueries({ queryKey: routeKeys.all })
      qc.invalidateQueries({ queryKey: routeKeys.detail(route.id) })
      toast.success(successMessage)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Ocurrió un error'),
  })
}

export function useAssignDriver(routeId: string) {
  return useRouteMutation(
    (driverId: string) => api.patch<RouteDetail>(`/routes/${routeId}/driver`, { driverId }),
    'Chofer asignado',
  )
}

export function useChangeRouteStatus(routeId: string) {
  return useRouteMutation(
    (status: RouteStatus) => api.patch<RouteDetail>(`/routes/${routeId}/status`, { status }),
    'Estado de la ruta actualizado',
  )
}

export function useRemoveStop(routeId: string) {
  return useRouteMutation(
    (stopId: string) => api.delete<RouteDetail>(`/routes/${routeId}/stops/${stopId}`),
    'Parada eliminada',
  )
}

export function useReorderStops(routeId: string) {
  return useRouteMutation(
    (stopIds: string[]) => api.patch<RouteDetail>(`/routes/${routeId}/stops/reorder`, { stopIds }),
    'Orden actualizado',
  )
}

export function useDispatchRoute(routeId: string) {
  return useRouteMutation(
    () => api.post<RouteDetail>(`/routes/${routeId}/dispatch`),
    'Ruta despachada al chofer por WhatsApp',
  )
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get<Driver[]>('/drivers'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { fullName: string; phone: string }) => api.post<Driver>('/drivers', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Chofer creado')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'No se pudo crear el chofer'),
  })
}
