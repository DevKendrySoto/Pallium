import {
  ExtraordinaryReason,
  Specialty,
  VisitModality,
  VisitType,
} from '@prisma/client'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

export class VisitAssignmentInput {
  @IsString()
  userId!: string

  @IsEnum(Specialty)
  specialty!: Specialty

  @IsOptional()
  @IsBoolean()
  isLead?: boolean
}

export class CreateVisitDto {
  @IsString()
  patientId!: string

  @IsEnum(VisitType)
  type!: VisitType

  /** Obligatorio cuando type = EXTRAORDINARY (validado en el servicio). */
  @IsOptional()
  @IsEnum(ExtraordinaryReason)
  reason?: ExtraordinaryReason

  @IsOptional()
  @IsEnum(VisitModality)
  modality?: VisitModality

  @IsDateString()
  scheduledDate!: string

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMin?: number

  /** Domicilio destino (si la modalidad es HOME). */
  @IsOptional()
  @IsString()
  addressId?: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VisitAssignmentInput)
  assignments?: VisitAssignmentInput[]
}
