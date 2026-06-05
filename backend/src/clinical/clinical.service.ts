import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { type Prisma, Specialty } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ClinicalRepository } from './clinical.repository'
import type {
  MedicalNoteDto,
  NursingNoteDto,
  PhysiotherapyNoteDto,
  PsychologyNoteDto,
  SocialWorkNoteDto,
  VitalsDto,
} from './dto/notes.dto'

interface BaseNote {
  patientId: string
  visitId?: string
  summary?: string
  vitals?: VitalsDto
}

@Injectable()
export class ClinicalService {
  constructor(
    private readonly repo: ClinicalRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async assertPatient(patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    })
    if (!patient) throw new NotFoundException('Paciente no encontrado')
  }

  /** Parte común del registro: paciente, autor, visita y vitales opcionales. */
  private base(dto: BaseNote, authorId: string, specialty: Specialty): Prisma.ClinicalRecordCreateInput {
    return {
      patient: { connect: { id: dto.patientId } },
      author: { connect: { id: authorId } },
      specialty,
      summary: dto.summary,
      ...(dto.visitId && { visit: { connect: { id: dto.visitId } } }),
      ...(dto.vitals && {
        vitalSigns: {
          create: [{ measuredBy: { connect: { id: authorId } }, ...dto.vitals }],
        },
      }),
    }
  }

  async createMedical(dto: MedicalNoteDto, authorId: string) {
    await this.assertPatient(dto.patientId)
    return this.repo.create({
      ...this.base(dto, authorId, Specialty.MEDICINE),
      medicalNote: {
        create: {
          chiefComplaint: dto.chiefComplaint,
          presentIllness: dto.presentIllness,
          physicalExam: dto.physicalExam,
          assessment: dto.assessment,
          plan: dto.plan,
          prognosis: dto.prognosis,
        },
      },
    })
  }

  async createNursing(dto: NursingNoteDto, authorId: string) {
    await this.assertPatient(dto.patientId)
    return this.repo.create({
      ...this.base(dto, authorId, Specialty.NURSING),
      nursingNote: {
        create: {
          generalCare: dto.generalCare,
          woundCare: dto.woundCare,
          medicationAdmin: dto.medicationAdmin,
          deviceManagement: dto.deviceManagement,
          patientEducation: dto.patientEducation,
        },
      },
    })
  }

  async createPsychology(dto: PsychologyNoteDto, authorId: string) {
    await this.assertPatient(dto.patientId)
    return this.repo.create({
      ...this.base(dto, authorId, Specialty.PSYCHOLOGY),
      psychologyNote: {
        create: {
          emotionalState: dto.emotionalState,
          mentalStatus: dto.mentalStatus,
          riskAssessment: dto.riskAssessment,
          interventions: dto.interventions,
          plan: dto.plan,
        },
      },
    })
  }

  async createSocialWork(dto: SocialWorkNoteDto, authorId: string) {
    await this.assertPatient(dto.patientId)
    return this.repo.create({
      ...this.base(dto, authorId, Specialty.SOCIAL_WORK),
      socialWorkNote: {
        create: {
          socioeconomic: dto.socioeconomic,
          familySupport: dto.familySupport,
          homeEnvironment: dto.homeEnvironment,
          resources: dto.resources,
          interventions: dto.interventions,
        },
      },
    })
  }

  async createPhysiotherapy(dto: PhysiotherapyNoteDto, authorId: string) {
    await this.assertPatient(dto.patientId)
    return this.repo.create({
      ...this.base(dto, authorId, Specialty.PHYSIOTHERAPY),
      physiotherapyNote: {
        create: {
          functionalAssessment: dto.functionalAssessment,
          mobility: dto.mobility,
          exercisesPrescribed: dto.exercisesPrescribed,
          goals: dto.goals,
          progress: dto.progress,
        },
      },
    })
  }

  listByPatient(patientId: string, specialty?: string) {
    if (specialty && !(specialty in Specialty)) {
      throw new BadRequestException('Especialidad inválida')
    }
    return this.repo.listByPatient(patientId, specialty as Specialty | undefined)
  }

  async getById(id: string) {
    const record = await this.repo.findById(id)
    if (!record) throw new NotFoundException('Registro clínico no encontrado')
    return record
  }
}
