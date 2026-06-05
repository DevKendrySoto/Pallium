import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import type { IDashboardStrategy } from './dashboard-strategy.interface'
import { NurseDashboardStrategy } from './nurse-dashboard.strategy'
import { PlaceholderDashboardStrategy } from './placeholder-dashboard.strategy'

/**
 * Resuelve la estrategia de dashboard según el rol del usuario.
 * Hoy solo ENFERMERIA tiene dashboard propio; el resto cae al placeholder.
 */
@Injectable()
export class DashboardStrategyFactory {
  constructor(
    private readonly nurse: NurseDashboardStrategy,
    private readonly placeholder: PlaceholderDashboardStrategy,
  ) {}

  resolve(user: AuthenticatedUser): IDashboardStrategy {
    if (user.roles.includes('ENFERMERIA')) return this.nurse
    return this.placeholder
  }
}
