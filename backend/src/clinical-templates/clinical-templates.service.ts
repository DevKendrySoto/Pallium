import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, type Specialty } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { validateTemplateSections } from './domain/template-validation'
import type {
  CreateClinicalTemplateDto,
  UpdateClinicalTemplateDto,
} from './dto/template-admin.dto'

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

  // ===== Administración (admin:operate) =====

  /** Todas las plantillas (incl. inactivas), para administración. */
  listAll() {
    return this.prisma.clinicalTemplate.findMany({ orderBy: [{ specialty: 'asc' }, { key: 'asc' }] })
  }

  async create(dto: CreateClinicalTemplateDto) {
    const key = dto.key.trim().toLowerCase()
    this.assertValidSections(dto.sections)
    const existing = await this.prisma.clinicalTemplate.findUnique({ where: { key } })
    if (existing) throw new ConflictException('Ya existe una plantilla con esa clave.')
    return this.prisma.clinicalTemplate.create({
      data: {
        key,
        name: dto.name.trim(),
        specialty: dto.specialty ?? null,
        categoryCode: dto.categoryCode?.trim() || null,
        sections: dto.sections as Prisma.InputJsonValue,
        version: 1,
      },
    })
  }

  async update(key: string, dto: UpdateClinicalTemplateDto) {
    const current = await this.getByKey(key)
    if (dto.sections !== undefined) this.assertValidSections(dto.sections)
    return this.prisma.clinicalTemplate.update({
      where: { key },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.specialty !== undefined && { specialty: dto.specialty ?? null }),
        ...(dto.categoryCode !== undefined && { categoryCode: dto.categoryCode?.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        // Un cambio estructural sube la versión (trazabilidad del registro clínico).
        ...(dto.sections !== undefined && {
          sections: dto.sections as Prisma.InputJsonValue,
          version: current.version + 1,
        }),
      },
    })
  }

  private assertValidSections(sections: unknown) {
    const errors = validateTemplateSections(sections)
    if (errors.length) throw new BadRequestException(errors)
  }
}
