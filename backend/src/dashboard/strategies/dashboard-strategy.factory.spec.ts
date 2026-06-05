import { DashboardStrategyFactory } from './dashboard-strategy.factory'

describe('DashboardStrategyFactory', () => {
  const nurse: any = { build: jest.fn() }
  const medico: any = { build: jest.fn() }
  const placeholder: any = { build: jest.fn() }
  const factory = new DashboardStrategyFactory(nurse, medico, placeholder)

  it('resuelve la estrategia de enfermería para el rol ENFERMERIA', () => {
    expect(factory.resolve({ roles: ['ENFERMERIA'] } as any)).toBe(nurse)
  })

  it('resuelve la estrategia de médico para el rol MEDICO', () => {
    expect(factory.resolve({ roles: ['MEDICO'] } as any)).toBe(medico)
  })

  it('cae al placeholder para otros roles', () => {
    expect(factory.resolve({ roles: ['ADMIN'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: ['COORDINADOR_MEDICO'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: [] } as any)).toBe(placeholder)
  })
})
