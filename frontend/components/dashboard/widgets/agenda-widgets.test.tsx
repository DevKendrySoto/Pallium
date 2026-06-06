import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RoutesTodayWidget } from './routes-today-widget'
import { VisitsToConfirmWidget } from './visits-to-confirm-widget'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { api } from '@/lib/api'
const mockApi = api as unknown as { post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> }

function wrap(node: ReactNode, qc: QueryClient) {
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>)
}

beforeEach(() => {
  mockApi.post.mockReset().mockResolvedValue({})
  mockApi.patch.mockReset().mockResolvedValue({})
})
afterEach(() => vi.clearAllMocks())

describe('VisitsToConfirmWidget', () => {
  it('muestra el estado vacío', () => {
    wrap(<VisitsToConfirmWidget data={{ visits: [], total: 0 }} />, new QueryClient())
    expect(screen.getByText('No hay visitas por confirmar hoy.')).toBeDefined()
  })

  it('confirmar llama a transition e invalida el dashboard', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    wrap(
      <VisitsToConfirmWidget
        data={{
          visits: [
            {
              id: 'v1',
              patient: { id: 'p1', name: 'Ana Pérez' },
              scheduledAt: new Date().toISOString(),
              modality: 'HOME',
              type: 'REGULAR',
              status: 'SCHEDULED',
            },
          ],
          total: 1,
        }}
      />,
      qc,
    )
    await user.click(screen.getByRole('button', { name: /Confirmar/ }))
    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/visits/v1/transition', { status: 'CONFIRMED' })
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'me'] })
  })
})

describe('RoutesTodayWidget', () => {
  it('despachar llama al endpoint e invalida el dashboard; oculta el botón si no se puede', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    wrap(
      <RoutesTodayWidget
        data={{
          routes: [
            { id: 'r1', name: 'Ruta Norte', status: 'PLANNED', driverName: 'Juan', stops: 3, canDispatch: true, dispatchedAt: null },
            { id: 'r2', name: 'Ruta Sur', status: 'DRAFT', driverName: null, stops: 0, canDispatch: false, dispatchedAt: null },
          ],
          total: 2,
        }}
      />,
      qc,
    )
    const dispatchButtons = screen.getAllByRole('button', { name: /Despachar/ })
    expect(dispatchButtons).toHaveLength(1) // solo la ruta despachable
    await user.click(dispatchButtons[0])
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/routes/r1/dispatch')
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'me'] })
  })
})
