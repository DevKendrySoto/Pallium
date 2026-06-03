import { VisitStatus, VisitType } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

export class ListVisitsDto {
  @IsOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus

  @IsOptional()
  @IsEnum(VisitType)
  type?: VisitType

  /** Rango de agenda (inclusive) sobre scheduledDate. */
  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20
}
