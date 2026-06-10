import { Module } from '@nestjs/common'
import { RolesController } from './roles.controller'
import { UsersAdminController } from './users-admin.controller'
import { UsersAdminService } from './users-admin.service'
import { UsersController } from './users.controller'
import { UsersManagementService } from './users-management.service'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController, RolesController, UsersAdminController],
  providers: [UsersService, UsersRepository, UsersManagementService, UsersAdminService],
  exports: [UsersService],
})
export class UsersModule {}
