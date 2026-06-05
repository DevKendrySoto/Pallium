import { Injectable } from '@nestjs/common'
import {
  type Prisma,
  AlertStatus,
  AlertType,
  TimelineEventType,
  VisitOutcome,
  VisitStatus,
  VisitType,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { computeNextRegularDue } from './domain/cadence'

const visitInclude = {
  assignments: { include: { user: { select: { id: true, fullName: true, specialty: true } } } },
  patient: { select: { id: true, mrn: true, firstName: true, lastName: true, status: true } },
  address: true,
} satisfies Prisma.VisitInclude

@Injectable()
export class VisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.VisitCreateInput) {
    return this.prisma.visit.create({ data, include: visitInclude })
  }

  findById(id: string) {
    return this.prisma.visit.findUnique({ where: { id }, include: visitInclude })
  }

  async list(params: {
    patientId?: string
    status?: VisitStatus
    type?: VisitType
    from?: string
    to?: string
    page: number
    pageSize: number
  }) {
    const where: Prisma.VisitWhereInput = {
      ...(params.patientId && { patientId: params.patientId }),
      ...(params.status && { status: params.status }),
      ...(params.type && { type: params.type }),
      ...((params.from || params.to) && {
        scheduledDate: {
          ...(params.from && { gte: new Date(params.from) }),
          ...(params.to && { lte: new Date(params.to) }),
        },
      }),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        include: visitInclude,
        orderBy: { scheduledDate: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.visit.count({ where }),
    ])
    return { items, total, page: params.page, pageSize: params.pageSize }
  }

  /** Reemplaza el equipo asignado de forma idempotente. */
  async replaceAssignments(
    visitId: string,
    assignments: { userId: string; specialty: Prisma.VisitAssignmentCreateManyInput['specialty']; isLead?: boolean }[],
  ) {
    await this.prisma.$transaction([
      this.prisma.visitAssignment.deleteMany({ where: { visitId } }),
      this.prisma.visitAssignment.createMany({
        data: assignments.map((a) => ({
          visitId,
          userId: a.userId,
          specialty: a.specialty,
          isLead: a.isLead ?? false,
        })),
      }),
    ])
    return this.findById(visitId)
  }

  /** Transición de estado simple con evento de timeline opcional. */
  transition(params: {
    visitId: string
    to: VisitStatus
    patientId: string
    note?: string
    extra?: Prisma.VisitUpdateInput
  }) {
    return this.prisma.visit.update({
      where: { id: params.visitId },
      data: { status: params.to, ...params.extra },
      include: visitInclude,
    })
  }

  /**
   * Completa la visita. Si es REGULAR, avanza el reloj de cadencia del paciente
   * (lastRegularVisitAt / nextRegularVisitDue) y resuelve sus alertas CADENCE abiertas.
   */
  completeVisit(params: { visitId: string; patientId: string; type: VisitType; completedAt: Date }) {
    const { visitId, patientId, type, completedAt } = params
    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.COMPLETED, completedAt, outcome: VisitOutcome.COMPLETED },
        include: visitInclude,
      })

      await tx.timelineEvent.create({
        data: {
          patientId,
          type: TimelineEventType.VISIT_COMPLETED,
          title: type === VisitType.REGULAR ? 'Visita regular realizada' : 'Visita extraordinaria realizada',
          occurredAt: completedAt,
          sourceType: 'visit',
          sourceId: visitId,
        },
      })

      if (type === VisitType.REGULAR) {
        await tx.patient.update({
          where: { id: patientId },
          data: {
            lastRegularVisitAt: completedAt,
            nextRegularVisitDue: computeNextRegularDue(completedAt),
          },
        })
        // La visita regular "salda" la cadencia: cierra alertas CADENCE pendientes.
        await tx.alert.updateMany({
          where: {
            patientId,
            type: AlertType.CADENCE,
            status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          data: { status: AlertStatus.RESOLVED, resolvedAt: completedAt },
        })
      }
      return visit
    })
  }

  /** Reagenda: marca la actual como RESCHEDULED y crea una nueva copiando el equipo. */
  reschedule(params: {
    visit: NonNullable<Awaited<ReturnType<VisitsRepository['findById']>>>
    newDate: Date
    reason?: string
  }) {
    const { visit, newDate, reason } = params
    return this.prisma.$transaction(async (tx) => {
      const next = await tx.visit.create({
        data: {
          patientId: visit.patientId,
          type: visit.type,
          reason: visit.reason,
          modality: visit.modality,
          status: VisitStatus.SCHEDULED,
          scheduledDate: newDate,
          durationMin: visit.durationMin,
          addressId: visit.addressId,
          assignments: {
            create: visit.assignments.map((a) => ({
              userId: a.userId,
              specialty: a.specialty,
              isLead: a.isLead,
            })),
          },
        },
        include: visitInclude,
      })

      await tx.visit.update({
        where: { id: visit.id },
        data: { status: VisitStatus.RESCHEDULED, rescheduledToId: next.id, cancelReason: reason },
      })

      await tx.timelineEvent.create({
        data: {
          patientId: visit.patientId,
          type: TimelineEventType.VISIT_SCHEDULED,
          title: 'Visita reagendada',
          description: reason,
          occurredAt: new Date(),
          sourceType: 'visit',
          sourceId: next.id,
        },
      })
      return next
    })
  }
}
