import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'

const ADMIN_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  _count: { select: { patients: true } },
} as const

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Categorías activas, para poblar selects (alta de paciente, filtros). */
  list() {
    return this.prisma.patientCategory.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  /** Todas las categorías (incluidas inactivas) con su uso, para administración. */
  listAll() {
    return this.prisma.patientCategory.findMany({
      select: ADMIN_SELECT,
      orderBy: { name: 'asc' },
    })
  }

  async create(dto: CreateCategoryDto) {
    const code = dto.code.trim().toUpperCase()
    const existing = await this.prisma.patientCategory.findUnique({ where: { code } })
    if (existing) throw new ConflictException('Ya existe una categoría con ese código.')
    return this.prisma.patientCategory.create({
      data: { code, name: dto.name.trim(), description: dto.description?.trim() || null },
      select: ADMIN_SELECT,
    })
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id)
    return this.prisma.patientCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: ADMIN_SELECT,
    })
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.patientCategory.findUnique({ where: { id }, select: { id: true } })
    if (!found) throw new NotFoundException('Categoría no encontrada.')
  }
}
