import { Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { AlertsService } from './alerts.service'
import { ListAlertsDto } from './dto/list-alerts.dto'

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @RequirePermissions('alert:read')
  list(@Query() query: ListAlertsDto) {
    return this.alerts.list(query)
  }

  @Patch(':id/acknowledge')
  @RequirePermissions('alert:manage')
  acknowledge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.alerts.acknowledge(id, userId)
  }

  @Patch(':id/resolve')
  @RequirePermissions('alert:manage')
  resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.alerts.resolve(id, userId)
  }
}
