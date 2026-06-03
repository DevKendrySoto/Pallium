import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(helmet())
  app.enableCors({ origin: true, credentials: true })
  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta props no declaradas en el DTO
      forbidNonWhitelisted: true,
      transform: true, // convierte payloads a instancias tipadas
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const port = config.getOrThrow<number>('port')
  await app.listen(port)
  console.log(`🚀 Pallium API en http://localhost:${port}/api`)
}

void bootstrap()
