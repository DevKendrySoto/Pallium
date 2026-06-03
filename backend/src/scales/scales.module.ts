import { Module } from '@nestjs/common'
import { AlertsModule } from '../alerts/alerts.module'
import { ScalesController } from './scales.controller'
import { ScalesRepository } from './scales.repository'
import { ScalesService } from './scales.service'

@Module({
  imports: [AlertsModule],
  controllers: [ScalesController],
  providers: [ScalesService, ScalesRepository],
  exports: [ScalesService],
})
export class ScalesModule {}
