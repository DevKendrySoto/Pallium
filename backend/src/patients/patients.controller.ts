import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { PatientsService } from './patients.service'
import { ChangeStatusDto } from './dto/change-status.dto'
import { CreatePatientDto } from './dto/create-patient.dto'
import { ListPatientsDto } from './dto/list-patients.dto'

@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @RequirePermissions('patient:read')
  list(@Query() query: ListPatientsDto) {
    return this.patients.list(query)
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  get(@Param('id') id: string) {
    return this.patients.getById(id)
  }

  @Post()
  @RequirePermissions('patient:create')
  create(@Body() dto: CreatePatientDto) {
    return this.patients.create(dto)
  }

  @Patch(':id/approve')
  @RequirePermissions('patient:approve')
  approve(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.patients.approve(id, actorId)
  }

  @Patch(':id/status')
  @RequirePermissions('patient:change-status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.patients.changeStatus(id, dto, actorId)
  }
}
