import { PatientStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ChangeStatusDto {
  @IsEnum(PatientStatus)
  status!: PatientStatus

  @IsOptional()
  @IsString()
  reason?: string
}
