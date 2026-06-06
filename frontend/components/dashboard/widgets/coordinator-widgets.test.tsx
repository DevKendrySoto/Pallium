import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PatientsToReviewWidget } from './patients-to-review-widget'
import { RoutesUnassignedWidget } from './routes-unassigned-widget'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

afterEach(() => vi.clearAllMocks())

describe('PatientsToReviewWidget', () => {
  it('estado vacío', () => {
    render(<PatientsToReviewWidget data={{ patients: [], total: 0 }} />)
    expect(screen.getByText('No hay pacientes que requieran revisión.')).toBeDefined()
  })

  it('navega al detalle del paciente al hacer click', async () => {
    const user = userEvent.setup()
    render(
      <PatientsToReviewWidget
        data={{
          patients: [{ id: 'p1', name: 'Ana Pérez', mrn: 'PAL-1', refusalCount: 3, reason: '3 rehúsos' }],
          total: 1,
        }}
      />,
    )
    await user.click(screen.getByText('Ana Pérez'))
    expect(push).toHaveBeenCalledWith('/patients/p1')
  })
})

describe('RoutesUnassignedWidget', () => {
  it('muestra qué falta y navega al detalle de la ruta', async () => {
    const user = userEvent.setup()
    render(
      <RoutesUnassignedWidget
        data={{
          routes: [{ id: 'r1', name: 'Norte', stops: 3, missingMedical: true, missingNursing: false }],
          total: 1,
        }}
      />,
    )
    expect(screen.getByText('Falta médico')).toBeDefined()
    expect(screen.queryByText('Falta enfermera')).toBeNull()
    await user.click(screen.getByText('Norte'))
    expect(push).toHaveBeenCalledWith('/routes/r1')
  })
})
