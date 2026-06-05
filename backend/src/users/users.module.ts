import { Module } from '@nestjs/common'
import { RolesController } from './roles.controller'
import { UsersController } from './users.controller'
import { UsersManagementService } from './users-management.service'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController, RolesController],
  providers: [UsersService, UsersRepository, UsersManagementService],
  exports: [UsersService],
})
export class UsersModule {}
