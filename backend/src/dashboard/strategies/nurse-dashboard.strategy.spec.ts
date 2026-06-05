import { NurseDashboardStrategy } from './nurse-dashboard.strategy'

const user = { id: 'nurse1', roles: ['ENFERMERIA'] } as any

function visit(over: Record<string, any>) {
  return {
    id: 'v',
    scheduledDate: new Date('2026-06-06T09:00:00Z'),
    type: 'REGULAR',
    status: 'SCHEDULED',
    outcome: null,
    routeStop: null,
    clinicalRecords: [],
    address: null,
    patient: {
      id: 'p',
      firstName: 'Ana',
      lastName: 'Pérez',
      birthDate: new Date('1950-01-01'),
      addresses: [],
      caregivers: [],
    },
    ...over,
  }
}

function buildRepo(over: Record<string, any> = {}) {
  return {
    clinicianVisitsOnDate: jest.fn().mockResolvedValue([]),
    assignedActivePatientIds: jest.fn().mockResolvedValue(['p']),
    countOpenClinicalAlerts: jest.fn().mockResolvedValue(0),
    openAlertsForPatients: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...over,
  }
}

describe('NurseDashboardStrategy', () => {
  it('devuelve 4 widgets en el orden correcto', async () => {
    const widgets = await new NurseDashboardStrategy(buildRepo() as any).build(user)
    expect(widgets.map((w) => w.type)).toEqual([
      'kpi_group',
      'today_visits',
      'alerts_list',
      'quick_actions',
    ])
  })

  it('consulta visitas con el campo de ruta de enfermería y especialidad NURSING', async () => {
    const repo: any = buildRepo()
    await new NurseDashboardStrategy(repo).build(user)
    expect(repo.clinicianVisitsOnDate).toHaveBeenCalledWith(
      'nurse1',
      { routeField: 'assignedNursingId', specialty: 'NURSING' },
      expect.any(Date),
    )
    expect(repo.assignedActivePatientIds).toHaveBeenCalledWith('nurse1', 'assignedNursingId')
  })

  it('calcula KPIs y ordena las visitas por orden de ruta', async () => {
    const repo: any = buildRepo({
      clinicianVisitsOnDate: jest.fn().mockResolvedValue([
        visit({ id: 'b', status: 'COMPLETED', routeStop: { sequence: 2, routeId: 'r1' }, clinicalRecords: [{ id: 'rec' }] }),
        visit({ id: 'a', status: 'IN_PROGRESS', routeStop: { sequence: 1, routeId: 'r1' } }),
      ]),
      countOpenClinicalAlerts: jest.fn().mockResolvedValue(3),
    })
    const widgets = await new NurseDashboardStrategy(repo).build(user)

    const kpi = widgets[0].data as any
    expect(kpi.items.map((i: any) => i.value)).toEqual([2, 1, 1, 3])

    const today = widgets[1].data as any
    expect(today.visits.map((v: any) => v.id)).toEqual(['a', 'b'])
    expect(today.visits[0].requiresClinicalRecord).toBe(true)
    expect(today.visits[1].requiresClinicalRecord).toBe(false)
  })

  it('mapea alertas con severidad en minúscula', async () => {
    const repo: any = buildRepo({
      openAlertsForPatients: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'al1',
            type: 'CLINICAL',
            severity: 'CRITICAL',
            title: 'Fiebre alta',
            createdAt: new Date(),
            patient: { id: 'p', firstName: 'Ana', lastName: 'Pérez' },
          },
        ],
        total: 1,
      }),
    })
    const widgets = await new NurseDashboardStrategy(repo).build(user)
    const alerts = widgets[2].data as any
    expect(alerts.alerts[0]).toMatchObject({ severity: 'critical', requiresAction: true })
    expect(alerts.alerts[0].patient.name).toBe('Ana Pérez')
  })
})
