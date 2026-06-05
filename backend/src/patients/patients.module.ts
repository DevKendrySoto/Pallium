import { Module } from '@nestjs/common'
import { AlertsModule } from '../alerts/alerts.module'
import { PatientsController } from './patients.controller'
import { PatientsRepository } from './patients.repository'
import { PatientsService } from './patients.service'

@Module({
  imports: [AlertsModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsService],
})
export class PatientsModule {}
