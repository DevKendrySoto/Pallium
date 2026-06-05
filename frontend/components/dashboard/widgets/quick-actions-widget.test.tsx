import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardSelectionProvider, useDashboardSelection } from '@/components/dashboard/dashboard-context'
import type { TodayVisitItem } from '@/features/dashboard/types'
import { QuickActionsWidget } from './quick-actions-widget'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { api } from '@/lib/api'
const mockApi = api as unknown as { post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> }

const visit: TodayVisitItem = {
  id: 'v1',
  patient: { id: 'p1', fullName: 'Ana Pérez', age: 70, addressShort: 'Calle 1', primaryCaregiver: null },
  scheduledAt: new Date().toISOString(),
  type: 'REGULAR',
  status: 'SCHEDULED',
  outcome: null,
  routeOrder: 1,
  routeId: 'r1',
  requiresClinicalRecord: true,
}

const ACTIONS = {
  actions: [
    { key: 'start_visit', label: 'Iniciar visita' },
    { key: 'mark_patient_absent', label: 'Paciente fuera de casa' },
    { key: 'mark_out_of_time', label: 'Fuera de tiempo' },
    { key: 'mark_care_refused', label: 'Rehúso de atención' },
    { key: 'reschedule', label: 'Reprogramar' },
  ],
}

function Harness({ qc }: { qc: QueryClient }) {
  function Selector() {
    const { selectVisit } = useDashboardSelection()
    useEffect(() => selectVisit(visit), [selectVisit])
    return <QuickActionsWidget data={ACTIONS} />
  }
  return (
    <QueryClientProvider client={qc}>
      <DashboardSelectionProvider>
        <Selector />
      </DashboardSelectionProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockApi.post.mockReset().mockResolvedValue({ refusalCount: 1, status: 'COMPLETED' })
  mockApi.patch.mockReset().mockResolvedValue({})
})
afterEach(() => vi.clearAllMocks())

describe('QuickActionsWidget', () => {
  it('"Iniciar visita" abre el registro clínico y NO completa la visita directamente', async () => {
    const user = userEvent.setup()
    render(<Harness qc={new QueryClient()} />)

    await user.click(await screen.findByRole('button', { name: 'Iniciar visita' }))

    // Abre el drawer de registro, no llama a ningún endpoint todavía.
    expect(await screen.findByText('Registro de enfermería')).toBeDefined()
    expect(mockApi.post).not.toHaveBeenCalled()
  })

  it('una acción de outcome invalida la query del dashboard', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient()
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    render(<Harness qc={qc} />)

    await user.click(await screen.findByRole('button', { name: 'Paciente fuera de casa' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/v1/visits/v1/outcome', expect.objectContaining({ outcome: 'PATIENT_NOT_HOME' }))
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'me'] })
  })
})
