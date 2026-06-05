import { RouteStatus } from '@prisma/client'
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateRouteDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsDateString()
  routeDate!: string

  @IsOptional()
  @IsString()
  driverId?: string

  @IsOptional()
  @IsString()
  notes?: string
}

/** Arma una ruta automáticamente con las visitas domiciliarias de un día. */
export class BuildFromVisitsDto {
  @IsDateString()
  routeDate!: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  driverId?: string
}

export class AddStopsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  visitIds!: string[]
}

export class ReorderStopsDto {
  /** IDs de parada en el nuevo orden deseado. */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  stopIds!: string[]
}

export class AssignDriverDto {
  @IsString()
  driverId!: string
}

export class ChangeRouteStatusDto {
  @IsEnum(RouteStatus)
  status!: RouteStatus
}

export class ListRoutesDto {
  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus
}
