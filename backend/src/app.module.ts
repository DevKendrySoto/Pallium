import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AlertsModule } from './alerts/alerts.module'
import { AuditModule } from './audit/audit.module'
import { AuthModule } from './auth/auth.module'
import { CadenceModule } from './cadence/cadence.module'
import { CategoriesModule } from './categories/categories.module'
import { ClinicalModule } from './clinical/clinical.module'
import { ClinicalTemplatesModule } from './clinical-templates/clinical-templates.module'
import { AuditInterceptor } from './common/interceptors/audit.interceptor'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { PermissionsGuard } from './common/guards/permissions.guard'
import { ReadOnlyGuard } from './common/guards/read-only.guard'
import { configuration } from './config/configuration'
import { validateEnv } from './config/env.validation'
import { DocumentsModule } from './documents/documents.module'
import { DriversModule } from './drivers/drivers.module'
import { HealthController } from './health/health.controller'
import { PatientsModule } from './patients/patients.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProfileModule } from './profile/profile.module'
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
    DocumentsModule,
    RoutesModule,
    ClinicalModule,
    ClinicalTemplatesModule,
    ScalesModule,
    CategoriesModule,
    ProfileModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    // Orden importa: primero autentica (JWT), luego autoriza (permisos).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ReadOnlyGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
