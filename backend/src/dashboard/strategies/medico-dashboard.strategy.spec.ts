import { MedicoDashboardStrategy } from './medico-dashboard.strategy'

const user = { id: 'doc1', roles: ['MEDICO'] } as any

function buildRepo() {
  return {
    clinicianVisitsOnDate: jest.fn().mockResolvedValue([]),
    assignedActivePatientIds: jest.fn().mockResolvedValue([]),
    countOpenClinicalAlerts: jest.fn().mockResolvedValue(0),
    openAlertsForPatients: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  }
}

describe('MedicoDashboardStrategy', () => {
  it('devuelve 4 widgets y consulta con el campo de ruta médica y especialidad MEDICINE', async () => {
    const repo: any = buildRepo()
    const widgets = await new MedicoDashboardStrategy(repo).build(user)

    expect(widgets.map((w) => w.type)).toEqual([
      'kpi_group',
      'today_visits',
      'alerts_list',
      'quick_actions',
    ])
    expect(repo.clinicianVisitsOnDate).toHaveBeenCalledWith(
      'doc1',
      { routeField: 'assignedMedicalId', specialty: 'MEDICINE' },
      expect.any(Date),
    )
  })

  it('usa la etiqueta de pendientes médica y el catálogo con aplicar escala', async () => {
    const widgets = await new MedicoDashboardStrategy(buildRepo() as any).build(user)
    const kpi = widgets[0].data as any
    expect(kpi.items[2].label).toBe('Pendientes de nota médica')

    const quick = widgets[3].data as any
    expect(quick.actions.map((a: any) => a.key)).toContain('apply_scale')
  })
})
