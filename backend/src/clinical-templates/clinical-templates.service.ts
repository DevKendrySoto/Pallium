import { Injectable, NotFoundException } from '@nestjs/common'
import type { Specialty } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ClinicalTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Plantillas activas, filtrables por especialidad y categoría del paciente. */
  list(params: { specialty?: Specialty; categoryCode?: string }) {
    return this.prisma.clinicalTemplate.findMany({
      where: {
        isActive: true,
        ...(params.specialty && { specialty: params.specialty }),
        // categoryCode null en la plantilla = aplica a todas.
        ...(params.categoryCode && {
          OR: [{ categoryCode: params.categoryCode }, { categoryCode: null }],
        }),
      },
      orderBy: { key: 'asc' },
    })
  }

  async getByKey(key: string) {
    const template = await this.prisma.clinicalTemplate.findUnique({ where: { key } })
    if (!template) throw new NotFoundException(`Plantilla ${key} no encontrada`)
    return template
  }
}
