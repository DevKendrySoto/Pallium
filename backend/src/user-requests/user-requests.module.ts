import { Module } from '@nestjs/common'
import { UserRequestsController } from './user-requests.controller'
import { UserRequestsService } from './user-requests.service'

@Module({
  controllers: [UserRequestsController],
  providers: [UserRequestsService],
})
export class UserRequestsModule {}
