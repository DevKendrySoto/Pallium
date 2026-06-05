import {
  CADENCE_DAYS,
  addDays,
  classifyCadence,
  computeNextRegularDue,
} from './cadence'

describe('cadence (reglas de cadencia)', () => {
  it('addDays suma días sin mutar el original', () => {
    const base = new Date('2026-06-01T00:00:00.000Z')
    const next = addDays(base, 30)
    expect(next.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(base.toISOString().slice(0, 10)).toBe('2026-06-01')
  })

  it('computeNextRegularDue = última + 30 días', () => {
    const last = new Date('2026-06-05T10:00:00.000Z')
    const due = computeNextRegularDue(last)
    expect(due.getTime()).toBe(addDays(last, CADENCE_DAYS).getTime())
  })

  it('classifyCadence: OK / DUE_SOON / OVERDUE', () => {
    const now = new Date('2026-06-05T00:00:00.000Z')
    expect(classifyCadence(null, now)).toBe('OK')
    expect(classifyCadence(addDays(now, -1), now)).toBe('OVERDUE')
    expect(classifyCadence(addDays(now, 3), now)).toBe('DUE_SOON')
    expect(classifyCadence(addDays(now, 20), now)).toBe('OK')
  })
})
