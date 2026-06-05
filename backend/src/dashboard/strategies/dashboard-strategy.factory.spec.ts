import { DashboardStrategyFactory } from './dashboard-strategy.factory'

describe('DashboardStrategyFactory', () => {
  const nurse: any = { build: jest.fn() }
  const placeholder: any = { build: jest.fn() }
  const factory = new DashboardStrategyFactory(nurse, placeholder)

  it('resuelve la estrategia de enfermería para el rol ENFERMERIA', () => {
    expect(factory.resolve({ roles: ['ENFERMERIA'] } as any)).toBe(nurse)
  })

  it('cae al placeholder para otros roles', () => {
    expect(factory.resolve({ roles: ['MEDICO'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: ['ADMIN'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: [] } as any)).toBe(placeholder)
  })
})
