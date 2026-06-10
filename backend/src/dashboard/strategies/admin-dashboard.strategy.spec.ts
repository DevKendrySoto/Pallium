import { AdminDashboardStrategy } from './admin-dashboard.strategy'

const user = { id: 'admin1', roles: ['ADMIN'] } as any

function buildRepo(over: Record<string, any> = {}) {
  return {
    countActivePatients: jest.fn().mockResolvedValue(0),
    countVisitsToday: jest.fn().mockResolvedValue(0),
    countOpenCriticalAlerts: jest.fn().mockResolvedValue(0),
    countDeathsThisMonth: jest.fn().mockResolvedValue(0),
    pendingAdminClosures: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    pendingUserRequests: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    escalatedAlerts: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    failedNotifications: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...over,
  }
}

describe('AdminDashboardStrategy', () => {
  it('devuelve 5 widgets en el orden correcto', async () => {
    const widgets = await new AdminDashboardStrategy(buildRepo() as any).build(user)
    expect(widgets.map((w) => w.type)).toEqual([
      'kpi_group',
      'pending_admin_closures',
      'pending_user_requests',
      'escalated_alerts',
      'failed_notifications',
    ])
  })

  it('calcula los 4 KPIs operativos', async () => {
    const repo: any = buildRepo({
      countActivePatients: jest.fn().mockResolvedValue(12),
      countVisitsToday: jest.fn().mockResolvedValue(8),
      countOpenCriticalAlerts: jest.fn().mockResolvedValue(2),
      countDeathsThisMonth: jest.fn().mockResolvedValue(3),
    })
    const widgets = await new AdminDashboardStrategy(repo).build(user)
    const kpi = widgets[0].data as any
    expect(kpi.items.map((i: any) => i.value)).toEqual([12, 8, 2, 3])
  })

  it('mapea cierres pendientes con días y cierre clínico', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const repo: any = buildRepo({
      pendingAdminClosures: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'p1',
            firstName: 'Ana',
            lastName: 'Pérez',
            deceasedAt: tenDaysAgo,
            _count: { clinicalRecords: 2 },
            statusHistory: [{ changedBy: { fullName: 'Dr. X' } }],
          },
        ],
        total: 1,
      }),
    })
    const widgets = await new AdminDashboardStrategy(repo).build(user)
    const item = (widgets[1].data as any).items[0]
    expect(item).toMatchObject({
      patient: { id: 'p1', fullName: 'Ana Pérez' },
      deceasedBy: 'Dr. X',
      hasClinicalClosure: true,
    })
    expect(item.daysPending).toBeGreaterThanOrEqual(9)
  })
})
