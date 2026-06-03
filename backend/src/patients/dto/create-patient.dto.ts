import { IdentificationType, Sex } from '@prisma/client'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreatePatientDto {
  @IsEnum(IdentificationType)
  identificationType!: IdentificationType

  @IsString()
  @MinLength(3)
  identificationNo!: string

  @IsString()
  @MinLength(2)
  firstName!: string

  @IsString()
  @MinLength(2)
  lastName!: string

  @IsDateString()
  birthDate!: string

  @IsEnum(Sex)
  sex!: Sex

  @IsString()
  categoryId!: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string
}
