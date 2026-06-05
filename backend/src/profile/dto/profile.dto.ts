import {
  AllergySeverity,
  AllergyType,
  HabitStatus,
  HabitType,
  HistoryCategory,
} from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'

export class CreateAllergyDto {
  @IsString() @MinLength(2) substance!: string
  @IsEnum(AllergyType) type!: AllergyType
  @IsOptional() @IsString() reaction?: string
  @IsEnum(AllergySeverity) severity!: AllergySeverity
  @IsOptional() @IsBoolean() isActive?: boolean
}

export class UpdateAllergyDto {
  @IsOptional() @IsString() @MinLength(2) substance?: string
  @IsOptional() @IsEnum(AllergyType) type?: AllergyType
  @IsOptional() @IsString() reaction?: string
  @IsOptional() @IsEnum(AllergySeverity) severity?: AllergySeverity
  @IsOptional() @IsBoolean() isActive?: boolean
}

export class CreateHistoryDto {
  @IsEnum(HistoryCategory) category!: HistoryCategory
  @IsString() @MinLength(2) description!: string
  @IsOptional() @IsInt() @Min(1900) @Max(2100) year?: number
}

export class UpdateHistoryDto {
  @IsOptional() @IsEnum(HistoryCategory) category?: HistoryCategory
  @IsOptional() @IsString() @MinLength(2) description?: string
  @IsOptional() @IsInt() @Min(1900) @Max(2100) year?: number
}

export class UpsertHabitDto {
  @IsEnum(HabitType) type!: HabitType
  @IsEnum(HabitStatus) status!: HabitStatus
  @IsOptional() @IsString() detail?: string
  @IsOptional() @IsString() quantity?: string
}

export class UpsertDirectiveDto {
  @IsOptional() @IsBoolean() dnr?: boolean
  @IsOptional() @IsString() preferredPlaceOfCare?: string
  @IsOptional() @IsString() lifeSupportPreferences?: string
  @IsOptional() @IsString() proxyName?: string
  @IsOptional() @IsString() proxyPhone?: string
  /** Si true, firma el documento (lo vuelve inmutable). */
  @IsOptional() @IsBoolean() sign?: boolean
}
