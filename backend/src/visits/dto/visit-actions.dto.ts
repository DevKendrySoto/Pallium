import { VisitStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

/** Transición genérica de estado (confirmar, en ruta, no-show, etc.). */
export class TransitionVisitDto {
  @IsEnum(VisitStatus)
  status!: VisitStatus

  @IsOptional()
  @IsString()
  note?: string
}

export class CancelVisitDto {
  @IsString()
  reason!: string
}

export class RescheduleVisitDto {
  @IsDateString()
  scheduledDate!: string

  @IsOptional()
  @IsString()
  reason?: string
}
