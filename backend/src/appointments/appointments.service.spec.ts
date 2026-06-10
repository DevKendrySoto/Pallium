import { AppointmentsService } from './appointments.service'

function visit(over: Record<string, any> = {}) {
  return {
    id: 'v',
    scheduledDate: new Date('2026-06-08T09:00:00Z'),
    durationMin: 30,
    type: 'REGULAR',
    status: 'SCHEDULED',
    outcome: null,
    patient: { id: 'p', firstName: 'Ana', lastName: 'Pérez', birthDate: new Date('1950-01-01'), addresses: [{ line1: 'Calle 1', city: 'Santiago' }] },
    address: null,
    routeStop: null,
    assignments: [],
    ...over,
  }
}

function build(visits: any[]) {
  const prisma: any = { visit: { findMany: jest.fn().mockResolvedValue(visits) } }
  return { service: new AppointmentsService(prisma), prisma }
}

describe('AppointmentsService.getCalendar', () => {
  it('por defecto consulta la semana (lunes-domingo) y devuelve 7 días', async () => {
    const { service, prisma } = build([])
    const res = await service.getCalendar({})
    expect(res.days).toHaveLength(7)
    // el rango por defecto arranca un lunes
    expect(new Date(res.days[0].date + 'T00:00:00').getDay()).toBe(1)
    expect(prisma.visit.findMany).toHaveBeenCalled()
  })

  it('agrupa por día, resume estados y deriva equipo/zona', async () => {
    const visits = [
      visit({ id: 'a', status: 'COMPLETED', routeStop: { sequence: 1, routeId: 'r1', route: { assignedMedical: { id: 'm1', fullName: 'Dr. X' }, assignedNursing: null } } }),
      visit({ id: 'b', status: 'NO_SHOW' }),
    ]
    const { service } = build(visits)
    const res = await service.getCalendar({ from: '2026-06-08', to: '2026-06-08' })
    expect(res.days).toHaveLength(1)
    const day = res.days[0]
    expect(day.summary).toMatchObject({ total: 2, completed: 1, noResponse: 1 })
    const a = day.appointments.find((x) => x.id === 'a')!
    expect(a.assignedMedical).toEqual({ id: 'm1', fullName: 'Dr. X' })
    expect(a.zone).toEqual({ id: 'Santiago', name: 'Santiago' })
    expect(a.routeOrder).toBe(1)
    expect(res.aggregates).toMatchObject({ totalWeek: 2, completionRate: 0.5 })
    expect(res.aggregates.byTeam.m1).toEqual({ total: 1, completed: 1 })
    expect(res.aggregates.byZone.Santiago.total).toBe(2)
  })

  it('filtra por zona (ciudad)', async () => {
    const visits = [
      visit({ id: 'a', patient: { id: 'p', firstName: 'A', lastName: 'B', birthDate: null, addresses: [{ line1: 'x', city: 'Santiago' }] } }),
      visit({ id: 'b', patient: { id: 'q', firstName: 'C', lastName: 'D', birthDate: null, addresses: [{ line1: 'y', city: 'Santo Domingo' }] } }),
    ]
    const { service } = build(visits)
    const res = await service.getCalendar({ from: '2026-06-08', to: '2026-06-08', zoneId: 'Santiago' })
    const all = res.days.flatMap((d) => d.appointments)
    expect(all.map((a) => a.id)).toEqual(['a'])
  })
})
