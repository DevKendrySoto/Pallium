import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardRepository } from './dashboard.repository'
import { DashboardService } from './dashboard.service'
import { AdminDashboardStrategy } from './strategies/admin-dashboard.strategy'
import { AgendaDashboardStrategy } from './strategies/agenda-dashboard.strategy'
import { CoordinatorDashboardStrategy } from './strategies/coordinator-dashboard.strategy'
import { DashboardStrategyFactory } from './strategies/dashboard-strategy.factory'
import { MedicoDashboardStrategy } from './strategies/medico-dashboard.strategy'
import { NurseDashboardStrategy } from './strategies/nurse-dashboard.strategy'
import { PlaceholderDashboardStrategy } from './strategies/placeholder-dashboard.strategy'

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardRepository,
    DashboardStrategyFactory,
    NurseDashboardStrategy,
    MedicoDashboardStrategy,
    AgendaDashboardStrategy,
    CoordinatorDashboardStrategy,
    AdminDashboardStrategy,
    PlaceholderDashboardStrategy,
  ],
})
export class DashboardModule {}
