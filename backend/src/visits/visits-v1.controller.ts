import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { RecordOutcomeDto } from './dto/visit-flow.dto'
import { VisitsService } from './visits.service'

/**
 * Endpoints versionados (v1) de visitas. Hoy solo el registro de resultado
 * desde la bandeja de la enfermera: POST /api/v1/visits/:id/outcome.
 */
@Controller('v1/visits')
export class VisitsV1Controller {
  constructor(private readonly visits: VisitsService) {}

  @Post(':id/outcome')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('visit:complete')
  recordOutcome(@Param('id') id: string, @Body() dto: RecordOutcomeDto) {
    return this.visits.recordOutcome(id, dto)
  }
}
