import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  PatientStatus,
  TimelineEventType,
  VisitModality,
  VisitStatus,
  VisitType,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { canTransitionVisit, isTerminalVisitStatus } from './domain/visit-status'
import type { AssignProfessionalsDto } from './dto/assign-professionals.dto'
import type { CreateVisitDto } from './dto/create-visit.dto'
import type { ListVisitsDto } from './dto/list-visits.dto'
import type {
  CancelVisitDto,
  RescheduleVisitDto,
  TransitionVisitDto,
} from './dto/visit-actions.dto'
import { VisitsRepository } from './visits.repository'

/** Estados que solo se alcanzan por endpoints dedicados (no por transición genérica). */
const DEDICATED = new Set<VisitStatus>([
  VisitStatus.COMPLETED,
  VisitStatus.CANCELLED,
  VisitStatus.RESCHEDULED,
])

@Injectable()
export class VisitsService {
  constructor(
    private readonly repo: VisitsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getOrThrow(id: string) {
    const visit = await this.repo.findById(id)
    if (!visit) throw new NotFoundException('Visita no encontrada')
    return visit
  }

  private assertTransition(from: VisitStatus, to: VisitStatus) {
    if (!canTransitionVisit(from, to)) {
      throw new BadRequestException(`Transición de visita no permitida: ${from} → ${to}`)
    }
  }

  async create(dto: CreateVisitDto) {
    // Regla regular/extraordinaria.
    if (dto.type === VisitType.EXTRAORDINARY && !dto.reason) {
      throw new BadRequestException('Una visita extraordinaria requiere un motivo')
    }
    if (dto.type === VisitType.REGULAR && dto.reason) {
      throw new BadRequestException('Una visita regular no lleva motivo extraordinario')
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!patient) throw new NotFoundException('Paciente no encontrado')
    if (patient.status === PatientStatus.DECEASED) {
      throw new BadRequestException('No se puede agendar a un paciente fallecido')
    }

    const visit = await this.repo.create({
      patient: { connect: { id: dto.patientId } },
      type: dto.type,
      reason: dto.reason,
      modality: dto.modality ?? VisitModality.HOME,
      scheduledDate: new Date(dto.scheduledDate),
      durationMin: dto.durationMin,
      ...(dto.addressId && { address: { connect: { id: dto.addressId } } }),
      ...(dto.assignments?.length && {
        assignments: {
          create: dto.assignments.map((a) => ({
            userId: a.userId,
            specialty: a.specialty,
            isLead: a.isLead ?? false,
          })),
        },
      }),
    })

    // El timeline cuelga del paciente, no de la visita.
    await this.prisma.timelineEvent.create({
      data: {
        patientId: dto.patientId,
        type: TimelineEventType.VISIT_SCHEDULED,
        title:
          dto.type === VisitType.REGULAR
            ? 'Visita regular agendada'
            : `Visita extraordinaria agendada (${dto.reason})`,
        occurredAt: new Date(),
        sourceType: 'visit',
        sourceId: visit.id,
      },
    })
    return visit
  }

  list(dto: ListVisitsDto) {
    return this.repo.list(dto)
  }

  get(id: string) {
    return this.getOrThrow(id)
  }

  async assign(id: string, dto: AssignProfessionalsDto) {
    const visit = await this.getOrThrow(id)
    if (isTerminalVisitStatus(visit.status)) {
      throw new BadRequestException('No se puede reasignar una visita cerrada')
    }
    return this.repo.replaceAssignments(id, dto.assignments)
  }

  /** Transición genérica: CONFIRMED, EN_ROUTE, IN_PROGRESS, NO_SHOW. */
  async transition(id: string, dto: TransitionVisitDto) {
    if (DEDICATED.has(dto.status)) {
      throw new BadRequestException(
        `Usa el endpoint dedicado para ${dto.status.toLowerCase()}`,
      )
    }
    const visit = await this.getOrThrow(id)
    this.assertTransition(visit.status, dto.status)
    return this.repo.transition({
      visitId: id,
      to: dto.status,
      patientId: visit.patientId,
      note: dto.note,
      // Check-in: al entrar EN_ROUTE/IN_PROGRESS sella la hora de inicio.
      ...(dto.status === VisitStatus.IN_PROGRESS && { extra: { checkInAt: new Date() } }),
    })
  }

  async complete(id: string) {
    const visit = await this.getOrThrow(id)
    this.assertTransition(visit.status, VisitStatus.COMPLETED)
    return this.repo.completeVisit({
      visitId: id,
      patientId: visit.patientId,
      type: visit.type,
      completedAt: new Date(),
    })
  }

  async cancel(id: string, dto: CancelVisitDto) {
    const visit = await this.getOrThrow(id)
    this.assertTransition(visit.status, VisitStatus.CANCELLED)
    return this.repo.transition({
      visitId: id,
      to: VisitStatus.CANCELLED,
      patientId: visit.patientId,
      extra: { cancelReason: dto.reason },
    })
  }

  async reschedule(id: string, dto: RescheduleVisitDto) {
    const visit = await this.getOrThrow(id)
    this.assertTransition(visit.status, VisitStatus.RESCHEDULED)
    return this.repo.reschedule({ visit, newDate: new Date(dto.scheduledDate), reason: dto.reason })
  }
}
