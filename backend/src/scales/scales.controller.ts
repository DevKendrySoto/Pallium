import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AssessScaleDto, ListAssessmentsDto } from './dto/assess-scale.dto'
import { CreateScaleDefinitionDto, UpdateScaleDefinitionDto } from './dto/scale-admin.dto'
import { ScalesService } from './scales.service'

@Controller('scales')
export class ScalesController {
  constructor(private readonly scales: ScalesService) {}

  /** Catálogo de escalas disponibles. */
  @Get()
  @RequirePermissions('scale:read')
  list() {
    return this.scales.listDefinitions()
  }

  @Get('assessments')
  @RequirePermissions('scale:read')
  listAssessments(@Query() query: ListAssessmentsDto) {
    return this.scales.listAssessments(query)
  }

  /** Catálogo completo (incl. inactivas) para administración. */
  @Get('all')
  @RequirePermissions('scale:manage')
  listAll() {
    return this.scales.listAllDefinitions()
  }

  @Get(':code')
  @RequirePermissions('scale:read')
  get(@Param('code') code: string) {
    return this.scales.getDefinition(code)
  }

  /** Aplica una escala a un paciente. */
  @Post('assess')
  @RequirePermissions('scale:assess')
  assess(@Body() dto: AssessScaleDto, @CurrentUser('id') userId: string) {
    return this.scales.assess(dto, userId)
  }

  @Post()
  @RequirePermissions('scale:manage')
  create(@Body() dto: CreateScaleDefinitionDto) {
    return this.scales.createDefinition(dto)
  }

  @Patch(':code')
  @RequirePermissions('scale:manage')
  update(@Param('code') code: string, @Body() dto: UpdateScaleDefinitionDto) {
    return this.scales.updateDefinition(code, dto)
  }
}
