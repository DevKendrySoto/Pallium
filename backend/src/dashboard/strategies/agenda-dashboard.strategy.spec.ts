import { AgendaDashboardStrategy } from './agenda-dashboard.strategy'

const user = { id: 'agenda1', roles: ['AGENDA'] } as any

function buildRepo(over: Record<string, any> = {}) {
  return {
    agendaScheduledVisits: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    routesToday: jest.fn().mockResolvedValue([]),
    countOverdueCadence: jest.fn().mockResolvedValue(0),
    openAdministrativeAlerts: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...over,
  }
}

describe('AgendaDashboardStrategy', () => {
  it('devuelve 4 widgets en el orden correcto', async () => {
    const widgets = await new AgendaDashboardStrategy(buildRepo() as any).build(user)
    expect(widgets.map((w) => w.type)).toEqual([
      'kpi_group',
      'visits_to_confirm',
      'routes_today',
      'alerts_list',
    ])
  })

  it('calcula los KPIs operativos', async () => {
    const repo: any = buildRepo({
      agendaScheduledVisits: jest.fn().mockResolvedValue({ items: [], total: 5 }),
      routesToday: jest.fn().mockResolvedValue([
        { id: 'r1', name: null, status: 'DRAFT', driverId: null, dispatchedAt: null, driver: null, _count: { stops: 0 } },
        { id: 'r2', name: null, status: 'DRAFT', driverId: null, dispatchedAt: null, driver: null, _count: { stops: 0 } },
      ]),
      countOverdueCadence: jest.fn().mockResolvedValue(3),
      openAdministrativeAlerts: jest.fn().mockResolvedValue({ items: [], total: 4 }),
    })
    const widgets = await new AgendaDashboardStrategy(repo).build(user)
    const kpi = widgets[0].data as any
    expect(kpi.items.map((i: any) => i.value)).toEqual([5, 2, 3, 4])
  })

  it('marca canDispatch solo con ruta planificada, chofer y paradas', async () => {
    const repo: any = buildRepo({
      routesToday: jest.fn().mockResolvedValue([
        { id: 'r1', name: 'A', status: 'PLANNED', driverId: 'd1', dispatchedAt: null, driver: { fullName: 'Juan' }, _count: { stops: 3 } },
        { id: 'r2', name: 'B', status: 'PLANNED', driverId: null, dispatchedAt: null, driver: null, _count: { stops: 2 } },
        { id: 'r3', name: 'C', status: 'DRAFT', driverId: 'd2', dispatchedAt: null, driver: { fullName: 'Ana' }, _count: { stops: 1 } },
      ]),
    })
    const widgets = await new AgendaDashboardStrategy(repo).build(user)
    const routes = (widgets[2].data as any).routes
    expect(routes.find((r: any) => r.id === 'r1').canDispatch).toBe(true)
    expect(routes.find((r: any) => r.id === 'r2').canDispatch).toBe(false) // sin chofer
    expect(routes.find((r: any) => r.id === 'r3').canDispatch).toBe(false) // estado DRAFT
  })
})
