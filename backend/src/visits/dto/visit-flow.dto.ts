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

/**
 * Resultado de la visita desde la bandeja de la enfermera.
 * Outcomes: COMPLETED, PATIENT_NOT_HOME (paciente fuera de casa),
 * OUT_OF_TIME (fuera de tiempo), REFUSED (rehúso de atención).
 */
export class RecordOutcomeDto {
  @IsEnum(VisitOutcome) outcome!: VisitOutcome
  @IsOptional() @IsString() reason?: string
  @IsOptional() @IsObject() metadata?: Record<string, unknown>
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
