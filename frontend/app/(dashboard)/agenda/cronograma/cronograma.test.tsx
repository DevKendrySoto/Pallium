import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const calendar = vi.fn()
vi.mock('@/features/calendar/hooks', () => ({
  useCalendar: () => calendar(),
  useRescheduleAppointment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelAppointment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import CronogramaPage from './page'

function wrap() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CronogramaPage />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.clearAllMocks())

describe('CronogramaPage', () => {
  it('muestra el estado vacío sin visitas', () => {
    calendar.mockReturnValue({ data: { days: [], aggregates: { totalWeek: 0, completionRate: 0, byTeam: {}, byZone: {} } }, isLoading: false, isError: false })
    wrap()
    expect(screen.getByText('No hay visitas programadas para esta semana.')).toBeDefined()
  })

  it('renderiza una visita y los agregados', () => {
    const appt = {
      id: 'v1', scheduledAt: new Date('2026-06-08T13:00:00Z').toISOString(), durationMinutes: 30, type: 'REGULAR', status: 'COMPLETED', outcome: 'COMPLETED',
      patient: { id: 'p1', fullName: 'Ana Pérez', addressShort: 'Calle 1', age: 70 },
      assignedMedical: { id: 'm1', fullName: 'Dr. House' }, assignedNursing: null, routeId: 'r1', routeOrder: 1, zone: { id: 'Santiago', name: 'Santiago' },
    }
    calendar.mockReturnValue({
      data: { days: [{ date: '2026-06-08', appointments: [appt], summary: { total: 1, completed: 1, cancelled: 0, pending: 0, noResponse: 0 } }], aggregates: { totalWeek: 1, completionRate: 1, byTeam: {}, byZone: {} } },
      isLoading: false, isError: false,
    })
    wrap()
    expect(screen.getByText('Ana Pérez')).toBeDefined()
    expect(screen.getByText('Visitas planeadas')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined() // tasa de completitud (1/1)
  })
})
