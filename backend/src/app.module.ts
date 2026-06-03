import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AlertsModule } from './alerts/alerts.module'
import { AuthModule } from './auth/auth.module'
import { CadenceModule } from './cadence/cadence.module'
import { ClinicalModule } from './clinical/clinical.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { PermissionsGuard } from './common/guards/permissions.guard'
import { configuration } from './config/configuration'
import { validateEnv } from './config/env.validation'
import { DriversModule } from './drivers/drivers.module'
import { HealthController } from './health/health.controller'
import { PatientsModule } from './patients/patients.module'
import { PrismaModule } from './prisma/prisma.module'
import { RoutesModule } from './routes/routes.module'
import { ScalesModule } from './scales/scales.module'
import { UsersModule } from './users/users.module'
import { VisitsModule } from './visits/visits.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [configuration],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    VisitsModule,
    AlertsModule,
    CadenceModule,
    DriversModule,
    RoutesModule,
    ClinicalModule,
    ScalesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Orden importa: primero autentica (JWT), luego autoriza (permisos).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
