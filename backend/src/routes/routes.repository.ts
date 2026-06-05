import { Injectable } from '@nestjs/common'
import {
  type Prisma,
  type RouteStatus,
  DispatchStatus,
  VisitModality,
  VisitStatus,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const routeDetailInclude = {
  driver: true,
  assignedMedical: { select: { id: true, fullName: true } },
  assignedNursing: { select: { id: true, fullName: true } },
  dispatches: { orderBy: { createdAt: 'desc' } },
  stops: {
    orderBy: { sequence: 'asc' },
    include: {
      visit: {
        include: {
          patient: { select: { id: true, mrn: true, firstName: true, lastName: true } },
          address: true,
        },
      },
    },
  },
} satisfies Prisma.RouteInclude

@Injectable()
export class RoutesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RouteCreateInput) {
    return this.prisma.route.create({ data, include: routeDetailInclude })
  }

  findById(id: string) {
    return this.prisma.route.findUnique({ where: { id }, include: routeDetailInclude })
  }

  list(params: { start?: Date; end?: Date; status?: RouteStatus }) {
    return this.prisma.route.findMany({
      where: {
        ...(params.status && { status: params.status }),
        ...((params.start || params.end) && {
          routeDate: {
            ...(params.start && { gte: params.start }),
            ...(params.end && { lt: params.end }),
          },
        }),
      },
      include: { driver: true, _count: { select: { stops: true } } },
      orderBy: { routeDate: 'desc' },
    })
  }

  /** Visitas domiciliarias agendadas en el rango y aún no asignadas a una ruta. */
  findUnassignedHomeVisits(start: Date, end: Date) {
    return this.prisma.visit.findMany({
      where: {
        modality: VisitModality.HOME,
        status: { in: [VisitStatus.SCHEDULED, VisitStatus.CONFIRMED] },
        scheduledDate: { gte: start, lt: end },
        routeStop: { is: null },
      },
      orderBy: { scheduledDate: 'asc' },
      select: { id: true, scheduledDate: true },
    })
  }

  async maxSequence(routeId: string): Promise<number> {
    const agg = await this.prisma.routeStop.aggregate({
      where: { routeId },
      _max: { sequence: true },
    })
    return agg._max.sequence ?? 0
  }

  createStops(data: Prisma.RouteStopCreateManyInput[]) {
    return this.prisma.routeStop.createMany({ data })
  }

  deleteStop(routeId: string, stopId: string) {
    return this.prisma.routeStop.deleteMany({ where: { id: stopId, routeId } })
  }

  /**
   * Reordena paradas de forma atómica. Se usan secuencias negativas temporales
   * para no chocar con el índice único (routeId, sequence).
   */
  reorderStops(routeId: string, orderedStopIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedStopIds.map((id, i) =>
          tx.routeStop.updateMany({ where: { id, routeId }, data: { sequence: -(i + 1) } }),
        ),
      )
      await Promise.all(
        orderedStopIds.map((id, i) =>
          tx.routeStop.updateMany({ where: { id, routeId }, data: { sequence: i + 1 } }),
        ),
      )
    })
  }

  assignDriver(routeId: string, driverId: string) {
    return this.prisma.route.update({
      where: { id: routeId },
      data: { driver: { connect: { id: driverId } } },
      include: routeDetailInclude,
    })
  }

  /** Conecta/desconecta el médico y/o enfermera asignados a la ruta. */
  assignClinicalTeam(
    routeId: string,
    data: { medicalId?: string | null; nursingId?: string | null },
  ) {
    const update: Prisma.RouteUpdateInput = {}
    if (data.medicalId !== undefined) {
      update.assignedMedical = data.medicalId
        ? { connect: { id: data.medicalId } }
        : { disconnect: true }
    }
    if (data.nursingId !== undefined) {
      update.assignedNursing = data.nursingId
        ? { connect: { id: data.nursingId } }
        : { disconnect: true }
    }
    return this.prisma.route.update({
      where: { id: routeId },
      data: update,
      include: routeDetailInclude,
    })
  }

  /** Personal clínico activo (médicos, coordinadores y enfermería) para asignar a rutas. */
  listClinicalStaff() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        roles: { some: { role: { code: { in: ['MEDICO', 'COORDINADOR_MEDICO', 'ENFERMERIA'] } } } },
      },
      select: {
        id: true,
        fullName: true,
        roles: { select: { role: { select: { code: true } } } },
      },
      orderBy: { fullName: 'asc' },
    })
  }

  /** Verifica que un usuario exista, esté activo y tenga alguno de los roles. */
  userWithAnyRoleExists(userId: string, roleCodes: string[]) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null,
        roles: { some: { role: { code: { in: roleCodes } } } },
      },
      select: { id: true },
    })
  }

  setStatus(routeId: string, status: RouteStatus, extra?: Prisma.RouteUpdateInput) {
    return this.prisma.route.update({
      where: { id: routeId },
      data: { status, ...extra },
      include: routeDetailInclude,
    })
  }

  /** Persiste el envío y marca la ruta como despachada en una sola transacción. */
  recordDispatch(params: {
    routeId: string
    toPhone: string
    message: string
    status: DispatchStatus
    providerMessageId?: string
    error?: string
    dispatchedById: string
    newRouteStatus: RouteStatus
  }) {
    const { routeId, toPhone, message, status, providerMessageId, error, dispatchedById, newRouteStatus } =
      params
    return this.prisma.$transaction(async (tx) => {
      await tx.routeDispatch.create({
        data: {
          routeId,
          toPhone,
          message,
          status,
          providerMessageId,
          error,
          sentAt: status === DispatchStatus.SENT ? new Date() : null,
        },
      })
      return tx.route.update({
        where: { id: routeId },
        data: {
          ...(status === DispatchStatus.SENT && {
            status: newRouteStatus,
            dispatchedBy: { connect: { id: dispatchedById } },
            dispatchedAt: new Date(),
          }),
        },
        include: routeDetailInclude,
      })
    })
  }
}
