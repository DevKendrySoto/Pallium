import { Injectable } from '@nestjs/common'
import { type Prisma, PatientStatus, TimelineEventType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PatientCreateInput) {
    return this.prisma.patient.create({ data })
  }

  findById(id: string) {
    return this.prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    })
  }

  /** Eventos del timeline del paciente, más recientes primero. */
  listTimeline(patientId: string) {
    return this.prisma.timelineEvent.findMany({
      where: { patientId },
      include: { actor: { select: { id: true, fullName: true } } },
      orderBy: { occurredAt: 'desc' },
    })
  }

  async list(params: {
    status?: PatientStatus
    categoryId?: string
    search?: string
    page: number
    pageSize: number
  }) {
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(params.status && { status: params.status }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { identificationNo: { contains: params.search, mode: 'insensitive' } },
          { mrn: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.patient.count({ where }),
    ])

    return { items, total, page: params.page, pageSize: params.pageSize }
  }

  /**
   * Cambia el estado de forma atómica: actualiza el paciente, registra la
   * transición en el historial y deja un evento en el timeline.
   */
  changeStatus(params: {
    patientId: string
    from: PatientStatus
    to: PatientStatus
    reason?: string
    actorId: string
    patientUpdate?: Prisma.PatientUpdateInput
  }) {
    const { patientId, from, to, reason, actorId, patientUpdate } = params
    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.update({
        where: { id: patientId },
        data: { status: to, ...patientUpdate },
      })
      await tx.patientStatusHistory.create({
        data: { patientId, fromStatus: from, toStatus: to, reason, changedById: actorId },
      })
      await tx.timelineEvent.create({
        data: {
          patientId,
          type: TimelineEventType.STATUS_CHANGE,
          title: `Estado: ${from} → ${to}`,
          description: reason,
          occurredAt: new Date(),
          actorId,
          sourceType: 'patient',
          sourceId: patientId,
        },
      })
      return patient
    })
  }

  countCreatedThisYear(year: number) {
    return this.prisma.patient.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
    })
  }
}
