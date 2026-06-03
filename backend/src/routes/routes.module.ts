import { Module } from '@nestjs/common'
import { DriversModule } from '../drivers/drivers.module'
import { RoutesController } from './routes.controller'
import { RoutesRepository } from './routes.repository'
import { RoutesService } from './routes.service'
import { LogWhatsappProvider, WHATSAPP_PROVIDER } from './whatsapp/whatsapp.provider'

@Module({
  imports: [DriversModule],
  controllers: [RoutesController],
  providers: [
    RoutesService,
    RoutesRepository,
    // Proveedor de WhatsApp: stub de log en dev. Sustituir por el real en prod.
    { provide: WHATSAPP_PROVIDER, useClass: LogWhatsappProvider },
  ],
  exports: [RoutesService],
})
export class RoutesModule {}
