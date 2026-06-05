import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardRepository } from './dashboard.repository'
import { DashboardService } from './dashboard.service'
import { DashboardStrategyFactory } from './strategies/dashboard-strategy.factory'
import { NurseDashboardStrategy } from './strategies/nurse-dashboard.strategy'
import { PlaceholderDashboardStrategy } from './strategies/placeholder-dashboard.strategy'

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardRepository,
    DashboardStrategyFactory,
    NurseDashboardStrategy,
    PlaceholderDashboardStrategy,
  ],
})
export class DashboardModule {}
