import { Module } from '@nestjs/common'
import { ClinicalController } from './clinical.controller'
import { ClinicalRepository } from './clinical.repository'
import { ClinicalService } from './clinical.service'

@Module({
  controllers: [ClinicalController],
  providers: [ClinicalService, ClinicalRepository],
  exports: [ClinicalService],
})
export class ClinicalModule {}
