import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PatientStatus, Prisma, TimelineEventType } from '@prisma/client'
import { computeNextRegularDue } from '../visits/domain/cadence'
import { canTransition } from './domain/patient-status'
import type { ChangeStatusDto } from './dto/change-status.dto'
import type { CreatePatientDto } from './dto/create-patient.dto'
import type { ListPatientsDto } from './dto/list-patients.dto'
import { PatientsRepository } from './patients.repository'

@Injectable()
export class PatientsService {
  constructor(private readonly repo: PatientsRepository) {}

  /** Genera un MRN legible: PAL-AÑO-#### (secuencial dentro del año). */
  private async generateMrn(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.repo.countCreatedThisYear(year)
    return `PAL-${year}-${String(count + 1).padStart(4, '0')}`
  }

  async create(dto: CreatePatientDto) {
    const mrn = await this.generateMrn()
    try {
      const patient = await this.repo.create({
        mrn,
        identificationType: dto.identificationType,
        identificationNo: dto.identificationNo,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: new Date(dto.birthDate),
        sex: dto.sex,
        phone: dto.phone,
        email: dto.email,
        status: PatientStatus.PENDING_APPROVAL,
        category: { connect: { id: dto.categoryId } },
        timeline: {
          create: {
            type: TimelineEventType.REGISTRATION,
            title: 'Paciente registrado',
            occurredAt: new Date(),
            sourceType: 'patient',
          },
        },
      })
      return patient
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Ya existe un paciente con esa identificación')
        }
        if (e.code === 'P2025') {
          throw new BadRequestException('La categoría indicada no existe')
        }
      }
      throw e
    }
  }

  list(dto: ListPatientsDto) {
    return this.repo.list(dto)
  }

  async getById(id: string) {
    const patient = await this.repo.findById(id)
    if (!patient) throw new NotFoundException('Paciente no encontrado')
    return patient
  }

  async getTimeline(id: string) {
    await this.getById(id) // 404 si no existe
    return this.repo.listTimeline(id)
  }

  /** Aprobación de admisión: PENDING_APPROVAL → ACTIVE, sella aprobador y fecha. */
  async approve(id: string, actorId: string) {
    const patient = await this.getById(id)
    if (patient.status !== PatientStatus.PENDING_APPROVAL) {
      throw new BadRequestException('El paciente no está pendiente de aprobación')
    }
    const now = new Date()
    return this.repo.changeStatus({
      patientId: id,
      from: patient.status,
      to: PatientStatus.ACTIVE,
      reason: 'Admisión aprobada',
      actorId,
      patientUpdate: {
        approvedBy: { connect: { id: actorId } },
        approvedAt: now,
        admittedAt: now,
        // Arranca el reloj de cadencia: primera visita regular a los 30 días.
        nextRegularVisitDue: computeNextRegularDue(now),
      },
    })
  }

  /** Cambio de estado general, validado contra la máquina de estados. */
  async changeStatus(id: string, dto: ChangeStatusDto, actorId: string) {
    const patient = await this.getById(id)
    if (patient.status === dto.status) {
      throw new BadRequestException('El paciente ya está en ese estado')
    }
    if (!canTransition(patient.status, dto.status)) {
      throw new BadRequestException(
        `Transición no permitida: ${patient.status} → ${dto.status}`,
      )
    }
    const patientUpdate =
      dto.status === PatientStatus.DECEASED ? { deceasedAt: new Date() } : undefined

    return this.repo.changeStatus({
      patientId: id,
      from: patient.status,
      to: dto.status,
      reason: dto.reason,
      actorId,
      patientUpdate,
    })
  }
}
