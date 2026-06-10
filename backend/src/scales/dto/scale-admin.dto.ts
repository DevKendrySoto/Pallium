import { ScaleCategory } from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateScaleDefinitionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Z0-9_]+$/, { message: 'El código solo admite mayúsculas, números y guion bajo.' })
  code!: string

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string

  @IsEnum(ScaleCategory)
  category!: ScaleCategory

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string

  @IsObject()
  schema!: Record<string, unknown>

  @IsOptional()
  @IsObject()
  alertRule?: Record<string, unknown> | null
}

export class UpdateScaleDefinitionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsEnum(ScaleCategory)
  category?: ScaleCategory

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsObject()
  schema?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  alertRule?: Record<string, unknown> | null
}
