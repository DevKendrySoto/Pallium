import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Z0-9_]+$/, { message: 'El código solo admite mayúsculas, números y guion bajo.' })
  code!: string

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
