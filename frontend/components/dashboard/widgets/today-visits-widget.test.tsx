import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayVisitsWidget } from './today-visits-widget'

describe('TodayVisitsWidget', () => {
  it('muestra el estado vacío cuando no hay visitas', () => {
    render(<TodayVisitsWidget data={{ visits: [], total: 0, completed: 0 }} />)
    expect(screen.getByText('No tienes visitas asignadas hoy.')).toBeDefined()
  })

  it('muestra el mensaje motivador cuando todas están completadas', () => {
    render(
      <TodayVisitsWidget
        data={{
          visits: [
            {
              id: 'v1',
              patient: { id: 'p', fullName: 'Ana Pérez', age: 70, addressShort: null, primaryCaregiver: null },
              scheduledAt: new Date().toISOString(),
              type: 'REGULAR',
              status: 'COMPLETED',
              outcome: 'COMPLETED',
              routeOrder: 1,
              routeId: 'r1',
              requiresClinicalRecord: false,
            },
          ],
          total: 1,
          completed: 1,
        }}
      />,
    )
    expect(screen.getByText('Completaste todas tus visitas. Buen trabajo.')).toBeDefined()
  })
})
