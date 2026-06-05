import { Injectable } from '@nestjs/common'
import { type AuditAction, type Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    entityType?: string
    action?: AuditAction
    actorId?: string
    page: number
    pageSize: number
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.action && { action: params.action }),
      ...(params.actorId && { actorId: params.actorId }),
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { items, total, page: params.page, pageSize: params.pageSize }
  }
}
