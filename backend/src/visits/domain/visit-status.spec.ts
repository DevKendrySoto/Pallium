import { VisitStatus } from '@prisma/client'
import { canTransitionVisit, isTerminalVisitStatus } from './visit-status'

describe('visit-status (máquina de estados)', () => {
  it('permite el camino feliz', () => {
    expect(canTransitionVisit(VisitStatus.SCHEDULED, VisitStatus.CONFIRMED)).toBe(true)
    expect(canTransitionVisit(VisitStatus.CONFIRMED, VisitStatus.IN_PROGRESS)).toBe(true)
    expect(canTransitionVisit(VisitStatus.IN_PROGRESS, VisitStatus.COMPLETED)).toBe(true)
  })

  it('permite NO_SHOW tras check-in (rehúso en curso)', () => {
    expect(canTransitionVisit(VisitStatus.IN_PROGRESS, VisitStatus.NO_SHOW)).toBe(true)
  })

  it('rechaza transiciones inválidas', () => {
    expect(canTransitionVisit(VisitStatus.COMPLETED, VisitStatus.IN_PROGRESS)).toBe(false)
    expect(canTransitionVisit(VisitStatus.SCHEDULED, VisitStatus.RESCHEDULED)).toBe(true)
    expect(canTransitionVisit(VisitStatus.CANCELLED, VisitStatus.COMPLETED)).toBe(false)
  })

  it('marca estados terminales', () => {
    expect(isTerminalVisitStatus(VisitStatus.COMPLETED)).toBe(true)
    expect(isTerminalVisitStatus(VisitStatus.CANCELLED)).toBe(true)
    expect(isTerminalVisitStatus(VisitStatus.RESCHEDULED)).toBe(true)
    expect(isTerminalVisitStatus(VisitStatus.IN_PROGRESS)).toBe(false)
    expect(isTerminalVisitStatus(VisitStatus.SCHEDULED)).toBe(false)
  })
})
