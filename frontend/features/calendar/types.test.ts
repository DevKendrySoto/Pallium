import { describe, expect, it } from 'vitest'
import { calendarResponseSchema } from './types'

describe('calendar zod', () => {
  it('valida un payload del cronograma', () => {
    const payload = {
      days: [
        {
          date: '2026-06-08',
          appointments: [
            {
              id: 'v1',
              scheduledAt: new Date().toISOString(),
              durationMinutes: 30,
              type: 'REGULAR',
              status: 'SCHEDULED',
              outcome: null,
              patient: { id: 'p1', fullName: 'Ana', addressShort: 'Calle 1', age: 70 },
              assignedMedical: { id: 'm1', fullName: 'Dr. X' },
              assignedNursing: null,
              routeId: 'r1',
              routeOrder: 1,
              zone: { id: 'Santiago', name: 'Santiago' },
            },
          ],
          summary: { total: 1, completed: 0, cancelled: 0, pending: 1, noResponse: 0 },
        },
      ],
      aggregates: { totalWeek: 1, completionRate: 0, byTeam: { m1: { total: 1, completed: 0 } }, byZone: {} },
    }
    expect(calendarResponseSchema.safeParse(payload).success).toBe(true)
  })

  it('rechaza un día con forma inválida', () => {
    expect(calendarResponseSchema.safeParse({ days: 'nope', aggregates: {} }).success).toBe(false)
  })
})
