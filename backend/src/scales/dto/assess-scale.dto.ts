import { IsObject, IsOptional, IsString } from 'class-validator'

export class AssessScaleDto {
  @IsString()
  patientId!: string

  /** Código de la escala (KARNOFSKY, ECOG, BARTHEL, ESAS, ...). */
  @IsString()
  scaleCode!: string

  @IsOptional()
  @IsString()
  visitId?: string

  /** Respuestas por ítem. La forma depende del tipo de escala. */
  @IsObject()
  items!: Record<string, unknown>

  @IsOptional()
  @IsString()
  interpretation?: string
}

export class ListAssessmentsDto {
  @IsOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @IsString()
  scaleCode?: string
}
