import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AssignProfessionalsDto } from './dto/assign-professionals.dto'
import { CreateVisitDto } from './dto/create-visit.dto'
import { ListVisitsDto } from './dto/list-visits.dto'
import {
  CancelVisitDto,
  RescheduleVisitDto,
  TransitionVisitDto,
} from './dto/visit-actions.dto'
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
}
