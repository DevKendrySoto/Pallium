import { PatientStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

export class ChangeStatusDto {
  @IsEnum(PatientStatus)
  status!: PatientStatus

  @IsOptional()
  @IsString()
  reason?: string

  // Obligatorios cuando status = DECEASED (validado en el servicio).
  @IsOptional()
  @IsDateString()
  deathDate?: string

  @IsOptional()
  @IsString()
  deathPlace?: string
}
