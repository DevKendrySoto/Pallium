import type { Env } from './env.validation'

/**
 * Config tipada y agrupada por dominio. Se accede vía `ConfigService`.
 * Lee de `process.env` (ya validado por `validateEnv`).
 */
export const configuration = () => {
  const env = process.env as unknown as Env
  return {
    nodeEnv: env.NODE_ENV,
    port: Number(env.PORT),
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtl: env.JWT_REFRESH_TTL,
    },
    s3: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
    },
  }
}

export type AppConfig = ReturnType<typeof configuration>
