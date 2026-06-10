import { Module } from '@nestjs/common'
import { RoutesModule } from '../routes/routes.module'
import { AdminController, NotificationsAdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
  imports: [RoutesModule],
  controllers: [AdminController, NotificationsAdminController],
  providers: [AdminService],
})
export class AdminModule {}
