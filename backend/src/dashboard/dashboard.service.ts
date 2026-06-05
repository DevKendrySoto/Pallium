import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import type { DashboardResponse } from './dashboard.types'
import { DashboardStrategyFactory } from './strategies/dashboard-strategy.factory'

@Injectable()
export class DashboardService {
  constructor(private readonly factory: DashboardStrategyFactory) {}

  /** Compone el dashboard del usuario actual resolviendo su estrategia por rol. */
  async forUser(user: AuthenticatedUser): Promise<DashboardResponse> {
    const strategy = this.factory.resolve(user)
    const widgets = await strategy.build(user)
    return { widgets }
  }
}
