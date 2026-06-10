import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { IsOptional, IsString } from 'class-validator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AdminService } from './admin.service'

class AdministrativeClosureDto {
  @IsOptional() @IsString() notes?: string
}

/** Acciones administrativas sobre pacientes. Solo admin (admin:operate). */
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('patients/:id/administrative-closure')
  @RequirePermissions('admin:operate')
  closure(
    @Param('id') id: string,
    @Body() dto: AdministrativeClosureDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.admin.markAdministrativeClosure(id, dto.notes, adminId)
  }
}

/** Reintento/descarte de notificaciones (despachos) fallidas. Solo admin. */
@Controller('v1/notifications')
export class NotificationsAdminController {
  constructor(private readonly admin: AdminService) {}

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:operate')
  retry(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.admin.retryNotification(id, adminId)
  }

  @Post(':id/discard')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:operate')
  discard(@Param('id') id: string) {
    return this.admin.discardNotification(id)
  }
}
