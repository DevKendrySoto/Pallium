import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { UserRequestStatus } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import {
  ApproveUserRequestDto,
  CreateUserRequestDto,
  RejectUserRequestDto,
} from './dto/user-request.dto'
import { UserRequestsService } from './user-requests.service'

@Controller('v1/user-requests')
export class UserRequestsController {
  constructor(private readonly service: UserRequestsService) {}

  // El coordinador (user:request) crea la solicitud.
  @Post()
  @RequirePermissions('user:request')
  create(@Body() dto: CreateUserRequestDto, @CurrentUser('id') requesterId: string) {
    return this.service.create(dto, requesterId)
  }

  // El admin (admin:operate) lista, aprueba y rechaza.
  @Get()
  @RequirePermissions('admin:operate')
  list(@Query('status') status?: UserRequestStatus) {
    return this.service.list(status ?? UserRequestStatus.PENDING)
  }

  @Patch(':id/approve')
  @RequirePermissions('admin:operate')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveUserRequestDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.service.approve(id, dto, adminId)
  }

  @Patch(':id/reject')
  @RequirePermissions('admin:operate')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectUserRequestDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.service.reject(id, dto, adminId)
  }
}
