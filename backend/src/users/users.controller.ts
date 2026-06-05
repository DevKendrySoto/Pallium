import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { CreateUserDto, UpdateUserDto } from './dto/user.dto'
import { UsersManagementService } from './users-management.service'

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersManagementService) {}

  @Get()
  @RequirePermissions('user:read')
  list() {
    return this.users.list()
  }

  @Post()
  @RequirePermissions('user:manage')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto)
  }

  @Patch(':id')
  @RequirePermissions('user:manage')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto)
  }
}
