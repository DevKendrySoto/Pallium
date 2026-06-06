import { DashboardStrategyFactory } from './dashboard-strategy.factory'

describe('DashboardStrategyFactory', () => {
  const nurse: any = { build: jest.fn() }
  const medico: any = { build: jest.fn() }
  const agenda: any = { build: jest.fn() }
  const coordinator: any = { build: jest.fn() }
  const placeholder: any = { build: jest.fn() }
  const factory = new DashboardStrategyFactory(nurse, medico, agenda, coordinator, placeholder)

  it('resuelve la estrategia de enfermería para el rol ENFERMERIA', () => {
    expect(factory.resolve({ roles: ['ENFERMERIA'] } as any)).toBe(nurse)
  })

  it('resuelve la estrategia de médico para el rol MEDICO', () => {
    expect(factory.resolve({ roles: ['MEDICO'] } as any)).toBe(medico)
  })

  it('resuelve la estrategia de agenda para el rol AGENDA', () => {
    expect(factory.resolve({ roles: ['AGENDA'] } as any)).toBe(agenda)
  })

  it('resuelve la estrategia de coordinador para el rol COORDINADOR_MEDICO', () => {
    expect(factory.resolve({ roles: ['COORDINADOR_MEDICO'] } as any)).toBe(coordinator)
  })

  it('cae al placeholder para otros roles', () => {
    expect(factory.resolve({ roles: ['ADMIN'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: ['AUDITOR'] } as any)).toBe(placeholder)
    expect(factory.resolve({ roles: [] } as any)).toBe(placeholder)
  })
})
