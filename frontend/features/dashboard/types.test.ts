import { describe, expect, it } from 'vitest'
import { dashboardResponseSchema, todayVisitsDataSchema } from './types'

describe('dashboard zod schemas', () => {
  it('valida un payload del backend bien formado', () => {
    const payload = {
      widgets: [
        { type: 'kpi_group', data: { items: [{ label: 'Pendientes', value: 2 }] } },
        { type: 'today_visits', data: { visits: [], total: 0, completed: 0 } },
      ],
    }
    const parsed = dashboardResponseSchema.parse(payload)
    expect(parsed.widgets).toHaveLength(2)
  })

  it('rechaza today_visits con forma inválida', () => {
    const bad = { visits: 'nope', total: 0, completed: 0 }
    expect(todayVisitsDataSchema.safeParse(bad).success).toBe(false)
  })
})
