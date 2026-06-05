import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** Almacenamiento de objetos en MinIO (S3-compatible). */
@Injectable()
export class StorageService {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('s3.bucket')
    this.client = new S3Client({
      endpoint: config.getOrThrow<string>('s3.endpoint'),
      region: config.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('s3.accessKey'),
        secretAccessKey: config.getOrThrow<string>('s3.secretKey'),
      },
      forcePathStyle: true, // requerido por MinIO
    })
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    )
  }

  /** URL temporal de descarga/visualización (por defecto 1 h). */
  getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    })
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
