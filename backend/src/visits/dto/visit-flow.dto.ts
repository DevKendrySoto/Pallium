import { Specialty, VisitOutcome } from '@prisma/client'
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CheckInDto {
  @IsOptional() @IsLatitude() latitude?: number
  @IsOptional() @IsLongitude() longitude?: number
}

export class CloseVisitDto {
  @IsEnum(VisitOutcome) outcome!: VisitOutcome
  @IsOptional() @IsString() reason?: string
}

export class SaveClinicalRecordDto {
  @IsEnum(Specialty) specialty!: Specialty
  @IsOptional() @IsString() templateKey?: string
  @IsOptional() @IsString() summary?: string
  /** Contenido serializado de la plantilla (sections → component → value). */
  @IsObject() data!: Record<string, unknown>
}

export class SignatureDto {
  @IsString() @MinLength(3) storageKey!: string
  @IsString() @MinLength(2) signerName!: string
}
