import { Specialty } from '@prisma/client'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(3)
  fullName!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleCodes!: string[]

  @IsOptional()
  @IsEnum(Specialty)
  specialty?: Specialty

  @IsOptional()
  @IsString()
  phone?: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  fullName?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsEnum(Specialty)
  specialty?: Specialty

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleCodes?: string[]
}
