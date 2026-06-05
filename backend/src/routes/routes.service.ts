import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  DispatchStatus,
  RouteStatus,
  VisitModality,
  VisitStatus,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { DriversService } from '../drivers/drivers.service'
import { buildDriverMessage, type StopForMessage } from './domain/route-message'
import { canTransitionRoute, isEditableRoute } from './domain/route-status'
import type {
  AddStopsDto,
  BuildFromVisitsDto,
  ChangeRouteStatusDto,
  CreateRouteDto,
  ListRoutesDto,
  ReorderStopsDto,
} from './dto/route.dto'
import { RoutesRepository } from './routes.repository'
import { WHATSAPP_PROVIDER, type WhatsappProvider } from './whatsapp/whatsapp.provider'

type RouteDetail = NonNullable<Awaited<ReturnType<RoutesRepository['findById']>>>

@Injectable()
export class RoutesService {
  constructor(
    private readonly repo: RoutesRepository,
    private readonly drivers: DriversService,
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsappProvider,
  ) {}

  /** Límites [00:00, +1 día) en UTC para el día indicado. */
  private dayBounds(dateStr: string): { start: Date; end: Date } {
    const start = new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start, end }
  }

  private async getOrThrow(id: string): Promise<RouteDetail> {
    const route = await this.repo.findById(id)
    if (!route) throw new NotFoundException('Ruta no encontrada')
    return route
  }

  private assertEditable(route: RouteDetail) {
    if (!isEditableRoute(route.status)) {
      throw new BadRequestException(`No se puede editar una ruta en estado ${route.status}`)
    }
  }

  create(dto: CreateRouteDto) {
    return this.repo.create({
      name: dto.name,
      routeDate: new Date(dto.routeDate),
      notes: dto.notes,
      ...(dto.driverId && { driver: { connect: { id: dto.driverId } } }),
    })
  }

  /** Crea una ruta con todas las visitas domiciliarias sin asignar del día. */
  async buildFromVisits(dto: BuildFromVisitsDto) {
    const { start, end } = this.dayBounds(dto.routeDate)
    const visits = await this.repo.findUnassignedHomeVisits(start, end)
    if (visits.length === 0) {
      throw new BadRequestException('No hay visitas domiciliarias sin asignar para ese día')
    }
    const route = await this.repo.create({
      name: dto.name ?? `Ruta ${dto.routeDate.slice(0, 10)}`,
      routeDate: new Date(dto.routeDate),
      ...(dto.driverId && { driver: { connect: { id: dto.driverId } } }),
    })
    await this.repo.createStops(
      visits.map((v, i) => ({
        routeId: route.id,
        visitId: v.id,
        sequence: i + 1,
        plannedArrival: v.scheduledDate,
      })),
    )
    return this.getOrThrow(route.id)
  }

  list(dto: ListRoutesDto) {
    const bounds = dto.date ? this.dayBounds(dto.date) : undefined
    return this.repo.list({ start: bounds?.start, end: bounds?.end, status: dto.status })
  }

  get(id: string) {
    return this.getOrThrow(id)
  }

  async addStops(id: string, dto: AddStopsDto) {
    const route = await this.getOrThrow(id)
    this.assertEditable(route)

    const visits = await this.prisma.visit.findMany({
      where: { id: { in: dto.visitIds } },
      select: { id: true, scheduledDate: true, modality: true, status: true, routeStop: { select: { id: true } } },
    })
    if (visits.length !== dto.visitIds.length) {
      throw new BadRequestException('Una o más visitas no existen')
    }
    for (const v of visits) {
      if (v.modality !== VisitModality.HOME) {
        throw new BadRequestException(`La visita ${v.id} no es domiciliaria`)
      }
      if (v.routeStop) {
        throw new BadRequestException(`La visita ${v.id} ya está en una ruta`)
      }
      if (v.status === VisitStatus.CANCELLED || v.status === VisitStatus.COMPLETED) {
        throw new BadRequestException(`La visita ${v.id} no es agendable en una ruta`)
      }
    }

    const base = await this.repo.maxSequence(id)
    await this.repo.createStops(
      visits.map((v, i) => ({
        routeId: id,
        visitId: v.id,
        sequence: base + i + 1,
        plannedArrival: v.scheduledDate,
      })),
    )
    return this.getOrThrow(id)
  }

  async removeStop(id: string, stopId: string) {
    const route = await this.getOrThrow(id)
    this.assertEditable(route)
    const deleted = await this.repo.deleteStop(id, stopId)
    if (deleted.count === 0) throw new NotFoundException('Parada no encontrada en la ruta')
    return this.getOrThrow(id)
  }

  async reorderStops(id: string, dto: ReorderStopsDto) {
    const route = await this.getOrThrow(id)
    this.assertEditable(route)
    const current = new Set(route.stops.map((s) => s.id))
    if (dto.stopIds.length !== current.size || dto.stopIds.some((s) => !current.has(s))) {
      throw new BadRequestException('La lista debe contener exactamente las paradas de la ruta')
    }
    await this.repo.reorderStops(id, dto.stopIds)
    return this.getOrThrow(id)
  }

  async assignDriver(id: string, driverId: string) {
    const route = await this.getOrThrow(id)
    this.assertEditable(route)
    await this.drivers.getOrThrow(driverId)
    return this.repo.assignDriver(id, driverId)
  }

  async changeStatus(id: string, dto: ChangeRouteStatusDto) {
    const route = await this.getOrThrow(id)
    if (!canTransitionRoute(route.status, dto.status)) {
      throw new BadRequestException(`Transición de ruta no permitida: ${route.status} → ${dto.status}`)
    }
    return this.repo.setStatus(id, dto.status)
  }

  /** Construye el mensaje y lo envía al chofer por WhatsApp, registrando el despacho. */
  async dispatch(id: string, dispatchedById: string) {
    const route = await this.getOrThrow(id)
    if (!route.driver) throw new BadRequestException('Asigna un chofer antes de despachar')
    if (route.stops.length === 0) throw new BadRequestException('La ruta no tiene paradas')
    if (route.status !== RouteStatus.PLANNED && route.status !== RouteStatus.DISPATCHED) {
      throw new BadRequestException(`La ruta debe estar PLANNED para despacharse (está ${route.status})`)
    }

    const stops: StopForMessage[] = route.stops.map((s) => ({
      sequence: s.sequence,
      plannedArrival: s.plannedArrival,
      patientName: `${s.visit.patient.firstName} ${s.visit.patient.lastName}`,
      addressLine: s.visit.address?.line1 ?? null,
      city: s.visit.address?.city ?? null,
      reference: s.visit.address?.reference ?? null,
    }))
    const message = buildDriverMessage({
      name: route.name,
      routeDate: route.routeDate,
      driverName: route.driver.fullName,
      stops,
    })

    try {
      const res = await this.whatsapp.sendText(route.driver.phone, message)
      return this.repo.recordDispatch({
        routeId: id,
        toPhone: route.driver.phone,
        message,
        status: DispatchStatus.SENT,
        providerMessageId: res.providerMessageId,
        dispatchedById,
        newRouteStatus: RouteStatus.DISPATCHED,
      })
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Fallo de envío'
      await this.repo.recordDispatch({
        routeId: id,
        toPhone: route.driver.phone,
        message,
        status: DispatchStatus.FAILED,
        error,
        dispatchedById,
        newRouteStatus: RouteStatus.DISPATCHED,
      })
      throw new BadGatewayException(`No se pudo enviar la ruta por WhatsApp: ${error}`)
    }
  }
}
