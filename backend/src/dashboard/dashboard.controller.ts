import { Controller, Get } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { DashboardService } from './dashboard.service'

@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Dashboard del usuario autenticado (bandeja de trabajo por rol). */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.forUser(user)
  }
}
