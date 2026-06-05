import { Controller, Get, Param, Query } from '@nestjs/common'
import { Specialty } from '@prisma/client'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { ClinicalTemplatesService } from './clinical-templates.service'

@Controller('clinical-templates')
export class ClinicalTemplatesController {
  constructor(private readonly templates: ClinicalTemplatesService) {}

  @Get()
  @RequirePermissions('clinical:read')
  list(@Query('specialty') specialty?: Specialty, @Query('category') categoryCode?: string) {
    return this.templates.list({ specialty, categoryCode })
  }

  @Get(':key')
  @RequirePermissions('clinical:read')
  get(@Param('key') key: string) {
    return this.templates.getByKey(key)
  }
}
