import { AuditAction } from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator'

export class ResetPasswordDto {
  @IsString() @MinLength(3) reason!: string
}

type ReassignMode = 'bulk' | 'unassigned'

export class DeactivateUserDto {
  @IsString() @MinLength(10) reason!: string

  @IsIn(['bulk', 'unassigned']) reassignFutureAppointments!: ReassignMode
  @IsOptional() @IsString() appointmentsReassignTo?: string

  @IsIn(['bulk', 'unassigned']) reassignFutureRoutes!: ReassignMode
  @IsOptional() @IsString() routesReassignTo?: string

  @IsBoolean() notifyCoordinator!: boolean
}

export class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(3) fullName?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() currentPassword?: string

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Requiere una mayúscula' })
  @Matches(/[0-9]/, { message: 'Requiere un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Requiere un símbolo' })
  newPassword?: string
}

export class ActivityQueryDto {
  @IsOptional() @IsISO8601() dateFrom?: string
  @IsOptional() @IsISO8601() dateTo?: string
  @IsOptional() @IsEnum(AuditAction) action?: AuditAction
  @IsOptional() @IsInt() @Min(1) page?: number
  @IsOptional() @IsInt() @Min(1) pageSize?: number
}
