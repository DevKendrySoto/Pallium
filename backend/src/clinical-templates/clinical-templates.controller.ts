import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Specialty } from '@prisma/client'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { ClinicalTemplatesService } from './clinical-templates.service'
import {
  CreateClinicalTemplateDto,
  UpdateClinicalTemplateDto,
} from './dto/template-admin.dto'

@Controller('clinical-templates')
export class ClinicalTemplatesController {
  constructor(private readonly templates: ClinicalTemplatesService) {}

  @Get()
  @RequirePermissions('clinical:read')
  list(@Query('specialty') specialty?: Specialty, @Query('category') categoryCode?: string) {
    return this.templates.list({ specialty, categoryCode })
  }

  /** Catálogo completo (incl. inactivas) para administración. */
  @Get('all')
  @RequirePermissions('admin:operate')
  listAll() {
    return this.templates.listAll()
  }

  @Get(':key')
  @RequirePermissions('clinical:read')
  get(@Param('key') key: string) {
    return this.templates.getByKey(key)
  }

  @Post()
  @RequirePermissions('admin:operate')
  create(@Body() dto: CreateClinicalTemplateDto) {
    return this.templates.create(dto)
  }

  @Patch(':key')
  @RequirePermissions('admin:operate')
  update(@Param('key') key: string, @Body() dto: UpdateClinicalTemplateDto) {
    return this.templates.update(key, dto)
  }
}
