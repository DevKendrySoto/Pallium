import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AlertsModule } from '../alerts/alerts.module'
import { CadenceController } from './cadence.controller'
import { CADENCE_QUEUE } from './cadence.constants'
import { CadenceProcessor } from './cadence.processor'
import { CadenceService } from './cadence.service'

@Module({
  imports: [
    AlertsModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('redis.url'))
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
          },
        }
      },
    }),
    BullModule.registerQueue({ name: CADENCE_QUEUE }),
  ],
  controllers: [CadenceController],
  providers: [CadenceService, CadenceProcessor],
})
export class CadenceModule {}
