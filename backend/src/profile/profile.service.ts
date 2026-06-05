import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type {
  CreateAllergyDto,
  CreateHistoryDto,
  UpdateAllergyDto,
  UpdateHistoryDto,
  UpsertDirectiveDto,
  UpsertHabitDto,
} from './dto/profile.dto'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPatient(patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    })
    if (!patient) throw new NotFoundException('Paciente no encontrado')
  }

  // ---- Alergias ----
  listAllergies(patientId: string) {
    return this.prisma.allergy.findMany({
      where: { patientId },
      orderBy: [{ isActive: 'desc' }, { severity: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async createAllergy(patientId: string, dto: CreateAllergyDto, userId: string) {
    await this.assertPatient(patientId)
    return this.prisma.allergy.create({ data: { ...dto, patientId, recordedById: userId } })
  }

  async updateAllergy(id: string, dto: UpdateAllergyDto) {
    await this.getAllergy(id)
    return this.prisma.allergy.update({ where: { id }, data: dto })
  }

  async deleteAllergy(id: string) {
    await this.getAllergy(id)
    await this.prisma.allergy.delete({ where: { id } })
  }

  private async getAllergy(id: string) {
    const a = await this.prisma.allergy.findUnique({ where: { id } })
    if (!a) throw new NotFoundException('Alergia no encontrada')
    return a
  }

  // ---- Antecedentes ----
  listHistory(patientId: string) {
    return this.prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async createHistory(patientId: string, dto: CreateHistoryDto, userId: string) {
    await this.assertPatient(patientId)
    return this.prisma.medicalHistory.create({ data: { ...dto, patientId, recordedById: userId } })
  }

  async updateHistory(id: string, dto: UpdateHistoryDto) {
    const h = await this.prisma.medicalHistory.findUnique({ where: { id } })
    if (!h) throw new NotFoundException('Antecedente no encontrado')
    return this.prisma.medicalHistory.update({ where: { id }, data: dto })
  }

  async deleteHistory(id: string) {
    const h = await this.prisma.medicalHistory.findUnique({ where: { id } })
    if (!h) throw new NotFoundException('Antecedente no encontrado')
    await this.prisma.medicalHistory.delete({ where: { id } })
  }

  // ---- Hábitos (upsert por tipo) ----
  listHabits(patientId: string) {
    return this.prisma.habit.findMany({ where: { patientId }, orderBy: { type: 'asc' } })
  }

  async upsertHabit(patientId: string, dto: UpsertHabitDto, userId: string) {
    await this.assertPatient(patientId)
    return this.prisma.habit.upsert({
      where: { patientId_type: { patientId, type: dto.type } },
      update: { status: dto.status, detail: dto.detail, quantity: dto.quantity, recordedById: userId },
      create: { ...dto, patientId, recordedById: userId },
    })
  }

  async deleteHabit(id: string) {
    const h = await this.prisma.habit.findUnique({ where: { id } })
    if (!h) throw new NotFoundException('Hábito no encontrado')
    await this.prisma.habit.delete({ where: { id } })
  }

  // ---- Voluntades anticipadas (1:1, inmutable tras firma) ----
  getDirective(patientId: string) {
    return this.prisma.advanceDirective.findUnique({ where: { patientId } })
  }

  async upsertDirective(patientId: string, dto: UpsertDirectiveDto, userId: string) {
    await this.assertPatient(patientId)
    const existing = await this.prisma.advanceDirective.findUnique({ where: { patientId } })
    if (existing?.signedAt) {
      throw new BadRequestException('Las voluntades anticipadas ya están firmadas y no se pueden modificar')
    }
    const { sign, ...fields } = dto
    const data = { ...fields, recordedById: userId, ...(sign ? { signedAt: new Date() } : {}) }
    return this.prisma.advanceDirective.upsert({
      where: { patientId },
      update: data,
      create: { ...data, patientId },
    })
  }
}
