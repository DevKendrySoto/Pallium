import { Specialty } from '@prisma/client'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateClinicalTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(/^[a-z0-9_]+$/, { message: 'La clave solo admite minúsculas, números y guion bajo.' })
  key!: string

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsEnum(Specialty)
  specialty?: Specialty | null

  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryCode?: string | null

  @IsArray()
  sections!: unknown[]
}

export class UpdateClinicalTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsEnum(Specialty)
  specialty?: Specialty | null

  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryCode?: string | null

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  sections?: unknown[]
}
