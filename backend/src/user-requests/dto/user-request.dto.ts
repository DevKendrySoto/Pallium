import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserRequestDto {
  @IsString() @MinLength(2) fullName!: string
  @IsEmail() email!: string
  @IsString() roleCode!: string
  @IsOptional() @IsString() reason?: string
}

export class ApproveUserRequestDto {
  /** Rol final; si se omite, se usa el de la solicitud. */
  @IsOptional() @IsString() roleCode?: string
}

export class RejectUserRequestDto {
  @IsString() @MinLength(3) reason!: string
}
