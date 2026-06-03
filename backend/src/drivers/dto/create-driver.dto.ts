import { IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class CreateDriverDto {
  @IsString()
  @MinLength(3)
  fullName!: string

  /** Teléfono en formato internacional para WhatsApp, p. ej. +18095551234. */
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Teléfono inválido (usa formato internacional)' })
  phone!: string
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  fullName?: string

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string
}
