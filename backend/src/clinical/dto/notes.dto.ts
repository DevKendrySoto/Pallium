import { Type } from 'class-transformer'
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

/** Signos vitales (opcionales, los toma enfermería/médico). */
export class VitalsDto {
  @IsOptional() @IsInt() @Min(40) @Max(300) systolicBp?: number
  @IsOptional() @IsInt() @Min(20) @Max(200) diastolicBp?: number
  @IsOptional() @IsInt() @Min(20) @Max(250) heartRate?: number
  @IsOptional() @IsInt() @Min(4) @Max(80) respiratoryRate?: number
  @IsOptional() @IsNumber() @Min(25) @Max(45) temperatureC?: number
  @IsOptional() @IsInt() @Min(0) @Max(100) spo2?: number
  @IsOptional() @IsInt() @Min(0) @Max(10) painScore?: number
  @IsOptional() @IsNumber() @Min(0) @Max(500) weightKg?: number
  @IsOptional() @IsNumber() @Min(10) @Max(1000) glucoseMgDl?: number
}

/** Campos comunes a toda nota clínica. */
class BaseNoteDto {
  @IsString() patientId!: string
  @IsOptional() @IsString() visitId?: string
  @IsOptional() @IsString() summary?: string
  @IsOptional() @ValidateNested() @Type(() => VitalsDto) vitals?: VitalsDto
}

export class MedicalNoteDto extends BaseNoteDto {
  @IsOptional() @IsString() chiefComplaint?: string
  @IsOptional() @IsString() presentIllness?: string
  @IsOptional() @IsString() physicalExam?: string
  @IsOptional() @IsString() assessment?: string
  @IsOptional() @IsString() plan?: string
  @IsOptional() @IsString() prognosis?: string
}

export class NursingNoteDto extends BaseNoteDto {
  @IsOptional() @IsString() generalCare?: string
  @IsOptional() @IsString() woundCare?: string
  @IsOptional() @IsString() medicationAdmin?: string
  @IsOptional() @IsString() deviceManagement?: string
  @IsOptional() @IsString() patientEducation?: string
}

export class PsychologyNoteDto extends BaseNoteDto {
  @IsOptional() @IsString() emotionalState?: string
  @IsOptional() @IsString() mentalStatus?: string
  @IsOptional() @IsString() riskAssessment?: string
  @IsOptional() @IsString() interventions?: string
  @IsOptional() @IsString() plan?: string
}

export class SocialWorkNoteDto extends BaseNoteDto {
  @IsOptional() @IsString() socioeconomic?: string
  @IsOptional() @IsString() familySupport?: string
  @IsOptional() @IsString() homeEnvironment?: string
  @IsOptional() @IsString() resources?: string
  @IsOptional() @IsString() interventions?: string
}

export class PhysiotherapyNoteDto extends BaseNoteDto {
  @IsOptional() @IsString() functionalAssessment?: string
  @IsOptional() @IsString() mobility?: string
  @IsOptional() @IsString() exercisesPrescribed?: string
  @IsOptional() @IsString() goals?: string
  @IsOptional() @IsString() progress?: string
}
