import {
  AllergySeverity,
  AllergyType,
  FamilyRole,
  HabitStatus,
  HabitType,
  HistoryCategory,
} from '@prisma/client'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
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

// ---- Fase 2 ----

export class CreateCaregiverDto {
  @IsString() @MinLength(2) fullName!: string
  @IsOptional() @IsString() relationship?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsBoolean() isPrimary?: boolean
  @IsOptional() @IsBoolean() isCohabitant?: boolean
  @IsOptional() @IsBoolean() burdenFlag?: boolean
}

export class UpdateCaregiverDto {
  @IsOptional() @IsString() @MinLength(2) fullName?: string
  @IsOptional() @IsString() relationship?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsBoolean() isPrimary?: boolean
  @IsOptional() @IsBoolean() isCohabitant?: boolean
  @IsOptional() @IsBoolean() burdenFlag?: boolean
}

export class CreateFamilyMemberDto {
  @IsString() @MinLength(2) name!: string
  @IsString() relationship!: string
  @IsOptional() @IsInt() @Min(0) @Max(130) age?: number
  @IsOptional() @IsBoolean() alive?: boolean
  @IsEnum(FamilyRole) role!: FamilyRole
  @IsOptional() @IsString() notes?: string
}

export class UpdateFamilyMemberDto {
  @IsOptional() @IsString() @MinLength(2) name?: string
  @IsOptional() @IsString() relationship?: string
  @IsOptional() @IsInt() @Min(0) @Max(130) age?: number
  @IsOptional() @IsBoolean() alive?: boolean
  @IsOptional() @IsEnum(FamilyRole) role?: FamilyRole
  @IsOptional() @IsString() notes?: string
}

export class GenogramDto {
  @IsObject() genogram!: Record<string, unknown>
}

export class UpsertSocialProfileDto {
  @IsOptional() @IsString() housingType?: string
  @IsOptional() @IsString() accessibility?: string
  @IsOptional() @IsString() basicServices?: string
  @IsOptional() @IsString() incomeLevel?: string
  @IsOptional() @IsString() occupation?: string
  @IsOptional() @IsString() insurance?: string
  @IsOptional() @IsInt() @Min(0) @Max(50) dependents?: number
  @IsOptional() @IsString() notes?: string
}

export class CreateImmunizationDto {
  @IsString() @MinLength(2) vaccine!: string
  @IsDateString() date!: string
  @IsOptional() @IsString() dose?: string
  @IsOptional() @IsString() lot?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateImmunizationDto {
  @IsOptional() @IsString() @MinLength(2) vaccine?: string
  @IsOptional() @IsDateString() date?: string
  @IsOptional() @IsString() dose?: string
  @IsOptional() @IsString() lot?: string
  @IsOptional() @IsString() notes?: string
}
