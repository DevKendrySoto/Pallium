import { DashboardService } from './dashboard.service'

describe('DashboardService', () => {
  it('resuelve la estrategia del usuario y envuelve los widgets', async () => {
    const widgets = [{ type: 'placeholder', data: { message: 'x' } }]
    const strategy = { build: jest.fn().mockResolvedValue(widgets) }
    const factory: any = { resolve: jest.fn().mockReturnValue(strategy) }
    const service = new DashboardService(factory)

    const user = { id: 'u1', roles: ['MEDICO'] } as any
    const out = await service.forUser(user)

    expect(factory.resolve).toHaveBeenCalledWith(user)
    expect(strategy.build).toHaveBeenCalledWith(user)
    expect(out).toEqual({ widgets })
  })
})
