import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import {
  ActivityQueryDto,
  DeactivateUserDto,
  ResetPasswordDto,
  UpdateMeDto,
} from './dto/user-admin.dto'
import { UsersAdminService } from './users-admin.service'

@Controller('v1/users')
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  // ----- Perfil propio (cualquier autenticado). Rutas estáticas antes de :id. -----

  @Patch('me')
  updateMe(@Body() dto: UpdateMeDto, @CurrentUser('id') userId: string) {
    return this.users.updateMe(userId, dto)
  }

  @Get('me/sessions')
  mySessions(@CurrentUser('id') userId: string) {
    return this.users.listSessions(userId)
  }

  @Delete('me/sessions/:sessionId')
  revokeMySession(@Param('sessionId') sessionId: string, @CurrentUser('id') userId: string) {
    return this.users.revokeSession(userId, sessionId)
  }

  @Delete('me/sessions')
  revokeMySessions(@CurrentUser('id') userId: string) {
    return this.users.revokeAllSessions(userId)
  }

  // ----- Administración de usuarios (user:manage). -----

  @Get('admin-count')
  @RequirePermissions('user:manage')
  adminCount() {
    return this.users.adminCount()
  }

  @Get(':id')
  @RequirePermissions('user:read')
  detail(@Param('id') id: string) {
    return this.users.detail(id)
  }

  @Get(':id/sessions')
  @RequirePermissions('user:manage')
  sessions(@Param('id') id: string) {
    return this.users.listSessions(id)
  }

  @Delete(':id/sessions/:sessionId')
  @RequirePermissions('user:manage')
  revokeSession(@Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.users.revokeSession(id, sessionId)
  }

  @Delete(':id/sessions')
  @RequirePermissions('user:manage')
  revokeAll(@Param('id') id: string) {
    return this.users.revokeAllSessions(id)
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('user:manage')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.users.resetPassword(id, dto.reason, adminId)
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('user:manage')
  deactivate(
    @Param('id') id: string,
    @Body() dto: DeactivateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.users.deactivate(id, dto, adminId)
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('user:manage')
  activate(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.users.activate(id, adminId)
  }

  @Get(':id/activity')
  @RequirePermissions('user:manage')
  activity(@Param('id') id: string, @Query() q: ActivityQueryDto) {
    return this.users.activity(id, q)
  }
}
