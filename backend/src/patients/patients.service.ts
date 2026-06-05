import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AlertSeverity, AlertType, PatientStatus, Prisma, TimelineEventType } from '@prisma/client'
import { AlertsService } from '../alerts/alerts.service'
import { computeNextRegularDue } from '../visits/domain/cadence'
import { canTransition } from './domain/patient-status'
import type { ChangeStatusDto } from './dto/change-status.dto'
import type { CreatePatientDto } from './dto/create-patient.dto'
import type { ListPatientsDto } from './dto/list-patients.dto'
import { PatientsRepository } from './patients.repository'

@Injectable()
export class PatientsService {
  constructor(
    private readonly repo: PatientsRepository,
    private readonly alerts: AlertsService,
  ) {}

  /** Genera un MRN legible: PAL-AÑO-#### (secuencial dentro del año). */
  private async generateMrn(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.repo.countCreatedThisYear(year)
    return `PAL-${year}-${String(count + 1).padStart(4, '0')}`
  }

  async create(dto: CreatePatientDto) {
    const mrn = await this.generateMrn()
    const now = new Date()
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
        // El paciente ingresa directamente como Activo (sin paso de aprobación).
        status: PatientStatus.ACTIVE,
        admittedAt: now,
        // Arranca el reloj de cadencia: primera visita regular a los 30 días.
        nextRegularVisitDue: computeNextRegularDue(now),
        category: { connect: { id: dto.categoryId } },
        timeline: {
          create: {
            type: TimelineEventType.REGISTRATION,
            title: 'Paciente registrado',
            occurredAt: now,
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

  /**
   * Cambio de estado general, validado contra la máquina de estados.
   * Solo ADMIN y COORDINADOR_MEDICO (permiso patient:change-status) llegan aquí.
   * Para DECESO exige fecha, lugar y motivo, y levanta una notificación.
   */
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

    let patientUpdate: Prisma.PatientUpdateInput | undefined
    if (dto.status === PatientStatus.DECEASED) {
      if (!dto.deathDate || !dto.deathPlace || !dto.reason?.trim()) {
        throw new BadRequestException(
          'Para registrar el deceso se requieren fecha, lugar y motivo',
        )
      }
      patientUpdate = {
        deceasedAt: new Date(),
        deathDate: new Date(dto.deathDate),
        deathPlace: dto.deathPlace,
      }
    }

    const updated = await this.repo.changeStatus({
      patientId: id,
      from: patient.status,
      to: dto.status,
      reason: dto.reason,
      actorId,
      patientUpdate,
    })

    if (dto.status === PatientStatus.DECEASED) {
      // Notifica el deceso (alerta administrativa crítica). El surface de alertas
      // es visible para ADMIN y COORDINADOR_MEDICO (ambos con alert:read).
      await this.alerts.raise({
        patientId: id,
        type: AlertType.ADMINISTRATIVE,
        severity: AlertSeverity.CRITICAL,
        title: 'Paciente fallecido',
        message: `${patient.firstName} ${patient.lastName} (${patient.mrn}). Motivo: ${dto.reason}. Lugar: ${dto.deathPlace}.`,
        sourceType: 'patient',
        sourceId: id,
        dedup: true,
      })
    }

    return updated
  }
}
