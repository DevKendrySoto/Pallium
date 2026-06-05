import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AssessScaleDto, ListAssessmentsDto } from './dto/assess-scale.dto'
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
}
