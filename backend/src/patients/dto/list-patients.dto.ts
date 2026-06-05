import { PatientStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListPatientsDto {
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus

  @IsOptional()
  @IsString()
  categoryId?: string

  /** Búsqueda por nombre o nº de identificación. */
  @IsOptional()
  @IsString()
  search?: string

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
