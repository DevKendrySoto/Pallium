import { Controller, Get } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { UsersManagementService } from './users-management.service'

@Controller('roles')
export class RolesController {
  constructor(private readonly users: UsersManagementService) {}

  @Get()
  @RequirePermissions('role:read')
  list() {
    return this.users.listRoles()
  }
}
