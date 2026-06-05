import { Injectable } from '@nestjs/common'
import { type Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ScalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDefinitions() {
    return this.prisma.scaleDefinition.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
  }

  findDefinitionByCode(code: string) {
    return this.prisma.scaleDefinition.findUnique({ where: { code } })
  }

  createAssessment(data: Prisma.ScaleAssessmentCreateInput) {
    return this.prisma.scaleAssessment.create({
      data,
      include: { scale: { select: { code: true, name: true, category: true } } },
    })
  }

  listAssessments(params: { patientId?: string; scaleId?: string }) {
    return this.prisma.scaleAssessment.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.scaleId && { scaleId: params.scaleId }),
      },
      include: { scale: { select: { code: true, name: true, category: true } } },
      orderBy: { assessedAt: 'desc' },
    })
  }
}
