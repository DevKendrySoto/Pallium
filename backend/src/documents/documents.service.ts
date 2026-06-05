import { randomUUID } from 'node:crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertPatient(patientId: string) {
    const p = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    })
    if (!p) throw new NotFoundException('Paciente no encontrado')
  }

  async upload(
    file: Express.Multer.File,
    params: { patientId: string; category?: string },
    userId: string,
  ) {
    await this.assertPatient(params.patientId)
    const safeName = file.originalname.replace(/[^\w.\-]/g, '_')
    const storageKey = `clinical/${params.patientId}/${randomUUID()}-${safeName}`
    await this.storage.put(storageKey, file.buffer, file.mimetype)

    const doc = await this.prisma.document.create({
      data: {
        patientId: params.patientId,
        fileName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        category: params.category,
        uploadedById: userId,
      },
    })
    const url = await this.storage.getPresignedUrl(storageKey)
    return { ...doc, url }
  }

  async list(patientId: string) {
    const docs = await this.prisma.document.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })
    return Promise.all(
      docs.map(async (d) => ({ ...d, url: await this.storage.getPresignedUrl(d.storageKey) })),
    )
  }

  async getUrl(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('Documento no encontrado')
    return { url: await this.storage.getPresignedUrl(doc.storageKey) }
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('Documento no encontrado')
    await this.storage.delete(doc.storageKey).catch(() => undefined)
    await this.prisma.document.delete({ where: { id } })
  }
}
