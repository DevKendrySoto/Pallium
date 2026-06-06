import { CoordinatorDashboardStrategy } from './coordinator-dashboard.strategy'

const user = { id: 'coord1', roles: ['COORDINADOR_MEDICO'] } as any

function buildRepo(over: Record<string, any> = {}) {
  return {
    countOpenCriticalAlerts: jest.fn().mockResolvedValue(0),
    routesTodayMissingTeam: jest.fn().mockResolvedValue([]),
    patientsToReview: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    countRecentAdmissions: jest.fn().mockResolvedValue(0),
    openSevereAlerts: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...over,
  }
}

describe('CoordinatorDashboardStrategy', () => {
  it('devuelve 4 widgets en el orden correcto', async () => {
    const widgets = await new CoordinatorDashboardStrategy(buildRepo() as any).build(user)
    expect(widgets.map((w) => w.type)).toEqual([
      'kpi_group',
      'patients_to_review',
      'routes_unassigned',
      'alerts_list',
    ])
  })

  it('calcula KPIs de supervisión', async () => {
    const repo: any = buildRepo({
      countOpenCriticalAlerts: jest.fn().mockResolvedValue(2),
      routesTodayMissingTeam: jest.fn().mockResolvedValue([{ id: 'r', name: null, assignedMedicalId: null, assignedNursingId: 'n', _count: { stops: 3 } }]),
      patientsToReview: jest.fn().mockResolvedValue({ items: [], total: 4 }),
      countRecentAdmissions: jest.fn().mockResolvedValue(7),
    })
    const widgets = await new CoordinatorDashboardStrategy(repo).build(user)
    const kpi = widgets[0].data as any
    expect(kpi.items.map((i: any) => i.value)).toEqual([2, 1, 4, 7])
  })

  it('marca qué le falta a cada ruta y mapea pacientes a revisar', async () => {
    const repo: any = buildRepo({
      routesTodayMissingTeam: jest.fn().mockResolvedValue([
        { id: 'r1', name: 'Norte', assignedMedicalId: null, assignedNursingId: 'n1', _count: { stops: 2 } },
      ]),
      patientsToReview: jest.fn().mockResolvedValue({
        items: [{ id: 'p1', mrn: 'PAL-1', firstName: 'Ana', lastName: 'Pérez', refusalCount: 3 }],
        total: 1,
      }),
    })
    const widgets = await new CoordinatorDashboardStrategy(repo).build(user)
    const route = (widgets[2].data as any).routes[0]
    expect(route).toMatchObject({ missingMedical: true, missingNursing: false, stops: 2 })
    const patient = (widgets[1].data as any).patients[0]
    expect(patient).toMatchObject({ name: 'Ana Pérez', mrn: 'PAL-1', refusalCount: 3 })
  })
})
