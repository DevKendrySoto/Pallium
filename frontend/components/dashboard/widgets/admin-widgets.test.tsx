import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EscalatedAlertsWidget } from './escalated-alerts-widget'
import { FailedNotificationsWidget } from './failed-notifications-widget'
import { PendingUserRequestsWidget } from './pending-user-requests-widget'

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
  mockApi.patch.mockReset().mockResolvedValue({ temporaryPassword: 'Pallium-abcd', email: 'x@y.com', mustChangePassword: true, userId: 'u1' })
})
afterEach(() => vi.clearAllMocks())

describe('FailedNotificationsWidget', () => {
  it('reintentar llama al endpoint e invalida el dashboard', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    wrap(
      <FailedNotificationsWidget data={{ items: [{ id: 'd1', channel: 'WHATSAPP', recipient: '+1809', lastError: 'timeout', failedAt: new Date().toISOString(), routeId: 'r1', routeName: 'Norte' }], total: 1 }} />,
      qc,
    )
    await user.click(screen.getByRole('button', { name: /Reintentar/ }))
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith('/v1/notifications/d1/retry'))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'me'] })
  })
})

describe('EscalatedAlertsWidget', () => {
  it('resolver llama a /alerts/:id/resolve', async () => {
    const user = userEvent.setup()
    wrap(
      <EscalatedAlertsWidget data={{ items: [{ id: 'a1', type: 'CLINICAL', severity: 'critical', title: 'Fiebre', patient: { id: 'p1', name: 'Ana' }, triggeredAt: new Date().toISOString(), hoursOpen: 6, assignedTo: null }], total: 1 }} />,
      new QueryClient(),
    )
    await user.click(screen.getByRole('button', { name: /Resolver/ }))
    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledWith('/alerts/a1/resolve'))
  })
})

describe('PendingUserRequestsWidget', () => {
  it('aprobar crea el usuario y muestra las credenciales temporales', async () => {
    const user = userEvent.setup()
    wrap(
      <PendingUserRequestsWidget data={{ items: [{ id: 'req1', fullName: 'Nuevo', email: 'n@x.com', roleCode: 'MEDICO', reason: null, requestedBy: 'Coord', createdAt: new Date().toISOString() }], total: 1 }} />,
      new QueryClient(),
    )
    await user.click(screen.getByRole('button', { name: /Aprobar/ }))
    await user.click(await screen.findByRole('button', { name: 'Crear usuario' }))
    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledWith('/v1/user-requests/req1/approve', { roleCode: undefined }))
    expect(await screen.findByText('Pallium-abcd')).toBeDefined()
  })
})
