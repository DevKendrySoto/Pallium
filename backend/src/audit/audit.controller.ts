import { Controller, Get, Query } from '@nestjs/common'
import { AuditAction } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AuditService } from './audit.service'

class ListAuditDto {
  @IsOptional() @IsString() entityType?: string
  @IsOptional() @IsEnum(AuditAction) action?: AuditAction
  @IsOptional() @IsString() actorId?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize: number = 50
}

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  list(@Query() query: ListAuditDto) {
    return this.audit.list(query)
  }
}
