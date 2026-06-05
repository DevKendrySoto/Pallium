import { Module } from '@nestjs/common'
import { ClinicalTemplatesController } from './clinical-templates.controller'
import { ClinicalTemplatesService } from './clinical-templates.service'

@Module({
  controllers: [ClinicalTemplatesController],
  providers: [ClinicalTemplatesService],
  exports: [ClinicalTemplatesService],
})
export class ClinicalTemplatesModule {}
