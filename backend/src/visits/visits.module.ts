import { Module } from '@nestjs/common'
import { AlertsModule } from '../alerts/alerts.module'
import { VisitsController } from './visits.controller'
import { VisitsRepository } from './visits.repository'
import { VisitsService } from './visits.service'

@Module({
  imports: [AlertsModule],
  controllers: [VisitsController],
  providers: [VisitsService, VisitsRepository],
  exports: [VisitsService],
})
export class VisitsModule {}
