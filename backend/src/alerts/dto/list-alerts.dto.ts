import { AlertSeverity, AlertStatus, AlertType } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ListAlertsDto {
  @IsOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType
}
