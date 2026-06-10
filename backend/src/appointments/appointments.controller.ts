import { Controller, Get, Query } from '@nestjs/common'
import { VisitStatus, VisitType } from '@prisma/client'
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AppointmentsService } from './appointments.service'

class CalendarQueryDto {
  @IsOptional() @IsISO8601() from?: string
  @IsOptional() @IsISO8601() to?: string
  @IsOptional() @IsString() zoneId?: string
  @IsOptional() @IsString() userId?: string
  @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus
  @IsOptional() @IsEnum(VisitType) type?: VisitType
}

@Controller('v1/appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  /** Cronograma de la clínica para un rango (por defecto, la semana actual). */
  @Get('calendar')
  @RequirePermissions('visit:read')
  calendar(@Query() query: CalendarQueryDto) {
    return this.service.getCalendar(query)
  }
}
