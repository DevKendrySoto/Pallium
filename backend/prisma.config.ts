import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Configuración de Prisma 7+.
 * La URL de conexión ya no vive en schema.prisma; se define aquí para Migrate.
 * En runtime, PrismaClient recibe un adapter (ver src/prisma/prisma.service.ts).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
