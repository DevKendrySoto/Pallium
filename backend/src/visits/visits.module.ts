import { Module } from '@nestjs/common'
import { AlertsModule } from '../alerts/alerts.module'
import { VisitsController } from './visits.controller'
import { VisitsV1Controller } from './visits-v1.controller'
import { VisitsRepository } from './visits.repository'
import { VisitsService } from './visits.service'

@Module({
  imports: [AlertsModule],
  controllers: [VisitsController, VisitsV1Controller],
  providers: [VisitsService, VisitsRepository],
  exports: [VisitsService],
})
export class VisitsModule {}
