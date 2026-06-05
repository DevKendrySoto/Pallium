import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  type Prisma,
  AlertSeverity,
  AlertType,
  PatientStatus,
  Specialty,
  TimelineEventType,
  VisitModality,
  VisitOutcome,
  VisitStatus,
  VisitType,
} from '@prisma/client'
import { AlertsService } from '../alerts/alerts.service'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
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
import type {
  CheckInDto,
  CloseVisitDto,
  SaveClinicalRecordDto,
  SignatureDto,
} from './dto/visit-flow.dto'
import { VisitsRepository } from './visits.repository'

/** Estados que solo se alcanzan por endpoints dedicados (no por transición genérica). */
const DEDICATED = new Set<VisitStatus>([
  VisitStatus.COMPLETED,
  VisitStatus.CANCELLED,
  VisitStatus.RESCHEDULED,
])

/** Rol (código) → especialidad clínica que puede registrar. */
const ROLE_SPECIALTY: Record<string, Specialty> = {
  MEDICO: Specialty.MEDICINE,
  ENFERMERIA: Specialty.NURSING,
  PSICOLOGIA: Specialty.PSYCHOLOGY,
  TRABAJO_SOCIAL: Specialty.SOCIAL_WORK,
  FISIATRA: Specialty.PHYSIOTHERAPY,
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly repo: VisitsRepository,
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
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

  // ===== Flujo de visita (Entregable 6) =====

  /** Check-in: inicia la visita y captura geolocalización (si se otorga). */
  async checkIn(id: string, dto: CheckInDto) {
    const visit = await this.getOrThrow(id)
    this.assertTransition(visit.status, VisitStatus.IN_PROGRESS)
    return this.repo.transition({
      visitId: id,
      to: VisitStatus.IN_PROGRESS,
      patientId: visit.patientId,
      extra: {
        checkInAt: new Date(),
        checkInLat: dto.latitude ?? null,
        checkInLng: dto.longitude ?? null,
      },
    })
  }

  /** Cierre de la visita con resultado y sus acciones automáticas. */
  async close(id: string, dto: CloseVisitDto) {
    const visit = await this.getOrThrow(id)

    if (dto.outcome === VisitOutcome.COMPLETED) {
      this.assertTransition(visit.status, VisitStatus.COMPLETED)
      return this.repo.completeVisit({
        visitId: id,
        patientId: visit.patientId,
        type: visit.type,
        completedAt: new Date(),
      })
    }

    // No realizada: NO_SHOW + outcome + acciones.
    this.assertTransition(visit.status, VisitStatus.NO_SHOW)
    const refused = dto.outcome === VisitOutcome.REFUSED

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id },
        data: { status: VisitStatus.NO_SHOW, outcome: dto.outcome, cancelReason: dto.reason },
      })
      await tx.timelineEvent.create({
        data: {
          patientId: visit.patientId,
          type: TimelineEventType.STATUS_CHANGE,
          title: `Visita no realizada (${dto.outcome})`,
          description: dto.reason,
          occurredAt: new Date(),
          sourceType: 'visit',
          sourceId: id,
        },
      })
      if (refused) {
        await tx.patient.update({
          where: { id: visit.patientId },
          data: { refusalCount: { increment: 1 } },
        })
      }
      return v
    })

    // Alerta a Agenda con la acción correspondiente.
    await this.alerts.raise({
      patientId: visit.patientId,
      type: AlertType.ADMINISTRATIVE,
      severity: refused ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
      title: refused ? 'Rehúso de atención' : 'Visita no realizada',
      message: refused
        ? `El paciente rehusó la atención${dto.reason ? `: ${dto.reason}` : ''}`
        : `Visita no realizada (${dto.outcome}). Reprogramar.`,
      sourceType: 'visit',
      sourceId: id,
    })

    return this.repo.findById(updated.id)
  }

  /** Crea o actualiza el registro clínico dinámico de la visita (borrador/cierre). */
  async saveClinicalRecord(id: string, dto: SaveClinicalRecordDto, user: AuthenticatedUser) {
    const visit = await this.getOrThrow(id)

    // B1 — cada rol solo registra su especialidad (ADMIN puede cualquiera).
    if (!user.roles.includes('ADMIN')) {
      const allowed = user.roles.map((r) => ROLE_SPECIALTY[r]).filter(Boolean)
      if (!allowed.includes(dto.specialty)) {
        throw new ForbiddenException('Solo puedes registrar la nota de tu especialidad')
      }
    }

    // B2 — inmutable cuando la visita está cerrada o firmada.
    if (isTerminalVisitStatus(visit.status) || visit.signedAt) {
      throw new ForbiddenException('La visita está cerrada o firmada; el registro es inmutable')
    }

    const authorId = user.id
    const existing = await this.prisma.clinicalRecord.findFirst({
      where: { visitId: id, authorId, specialty: dto.specialty, deletedAt: null },
      select: { id: true },
    })
    const data = dto.data as Prisma.InputJsonValue

    if (existing) {
      return this.prisma.clinicalRecord.update({
        where: { id: existing.id },
        data: { templateKey: dto.templateKey, summary: dto.summary, data },
      })
    }

    const record = await this.prisma.clinicalRecord.create({
      data: {
        patient: { connect: { id: visit.patientId } },
        visit: { connect: { id } },
        specialty: dto.specialty,
        author: { connect: { id: authorId } },
        templateKey: dto.templateKey,
        summary: dto.summary,
        data,
      },
    })
    await this.prisma.timelineEvent.create({
      data: {
        patientId: visit.patientId,
        type: TimelineEventType.CLINICAL_NOTE,
        title: `Nota clínica — ${dto.specialty}`,
        occurredAt: new Date(),
        actorId: authorId,
        sourceType: 'clinical_record',
        sourceId: record.id,
      },
    })
    return record
  }

  /** Firma del cuidador; sella la visita. */
  async signCaregiver(id: string, dto: SignatureDto) {
    await this.getOrThrow(id)
    return this.prisma.visit.update({
      where: { id },
      data: {
        caregiverSignatureKey: dto.storageKey,
        signerName: dto.signerName,
        signedAt: new Date(),
      },
    })
  }
}
