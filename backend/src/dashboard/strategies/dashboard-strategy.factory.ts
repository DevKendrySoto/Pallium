import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { AgendaDashboardStrategy } from './agenda-dashboard.strategy'
import type { IDashboardStrategy } from './dashboard-strategy.interface'
import { MedicoDashboardStrategy } from './medico-dashboard.strategy'
import { NurseDashboardStrategy } from './nurse-dashboard.strategy'
import { PlaceholderDashboardStrategy } from './placeholder-dashboard.strategy'

/**
 * Resuelve la estrategia de dashboard según el rol del usuario.
 * ENFERMERIA, MEDICO y AGENDA tienen dashboard propio; el resto cae al placeholder.
 */
@Injectable()
export class DashboardStrategyFactory {
  constructor(
    private readonly nurse: NurseDashboardStrategy,
    private readonly medico: MedicoDashboardStrategy,
    private readonly agenda: AgendaDashboardStrategy,
    private readonly placeholder: PlaceholderDashboardStrategy,
  ) {}

  resolve(user: AuthenticatedUser): IDashboardStrategy {
    if (user.roles.includes('ENFERMERIA')) return this.nurse
    if (user.roles.includes('MEDICO')) return this.medico
    if (user.roles.includes('AGENDA')) return this.agenda
    return this.placeholder
  }
}
