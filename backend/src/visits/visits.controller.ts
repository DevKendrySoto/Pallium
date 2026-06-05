import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AssignProfessionalsDto } from './dto/assign-professionals.dto'
import { CreateVisitDto } from './dto/create-visit.dto'
import { ListVisitsDto } from './dto/list-visits.dto'
import {
  CancelVisitDto,
  RescheduleVisitDto,
  TransitionVisitDto,
} from './dto/visit-actions.dto'
import {
  CheckInDto,
  CloseVisitDto,
  SaveClinicalRecordDto,
  SignatureDto,
} from './dto/visit-flow.dto'
import { VisitsService } from './visits.service'

@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get()
  @RequirePermissions('visit:read')
  list(@Query() query: ListVisitsDto) {
    return this.visits.list(query)
  }

  @Get(':id')
  @RequirePermissions('visit:read')
  get(@Param('id') id: string) {
    return this.visits.get(id)
  }

  @Post()
  @RequirePermissions('visit:create')
  create(@Body() dto: CreateVisitDto) {
    return this.visits.create(dto)
  }

  @Post(':id/assignments')
  @RequirePermissions('visit:assign')
  assign(@Param('id') id: string, @Body() dto: AssignProfessionalsDto) {
    return this.visits.assign(id, dto)
  }

  @Patch(':id/transition')
  @RequirePermissions('visit:update')
  transition(@Param('id') id: string, @Body() dto: TransitionVisitDto) {
    return this.visits.transition(id, dto)
  }

  @Patch(':id/complete')
  @RequirePermissions('visit:complete')
  complete(@Param('id') id: string) {
    return this.visits.complete(id)
  }

  @Patch(':id/cancel')
  @RequirePermissions('visit:cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelVisitDto) {
    return this.visits.cancel(id, dto)
  }

  @Patch(':id/reschedule')
  @RequirePermissions('visit:update')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleVisitDto) {
    return this.visits.reschedule(id, dto)
  }

  // ===== Flujo de visita =====

  @Post(':id/check-in')
  @RequirePermissions('visit:complete')
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return this.visits.checkIn(id, dto)
  }

  @Post(':id/close')
  @RequirePermissions('visit:complete')
  close(@Param('id') id: string, @Body() dto: CloseVisitDto) {
    return this.visits.close(id, dto)
  }

  @Post(':id/clinical-record')
  @RequirePermissions('visit:complete')
  saveClinicalRecord(
    @Param('id') id: string,
    @Body() dto: SaveClinicalRecordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visits.saveClinicalRecord(id, dto, userId)
  }

  @Post(':id/signature')
  @RequirePermissions('visit:complete')
  signCaregiver(@Param('id') id: string, @Body() dto: SignatureDto) {
    return this.visits.signCaregiver(id, dto)
  }
}
