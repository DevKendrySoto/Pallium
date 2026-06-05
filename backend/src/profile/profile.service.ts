import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type {
  CreateAllergyDto,
  CreateCaregiverDto,
  CreateFamilyMemberDto,
  CreateHistoryDto,
  CreateImmunizationDto,
  UpdateAllergyDto,
  UpdateCaregiverDto,
  UpdateFamilyMemberDto,
  UpdateHistoryDto,
  UpdateImmunizationDto,
  UpsertDirectiveDto,
  UpsertHabitDto,
  UpsertSocialProfileDto,
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

  // ---- Cuidadores (Fase 2) ----
  listCaregivers(patientId: string) {
    return this.prisma.caregiver.findMany({
      where: { patientId },
      orderBy: [{ isPrimary: 'desc' }, { fullName: 'asc' }],
    })
  }

  async createCaregiver(patientId: string, dto: CreateCaregiverDto) {
    await this.assertPatient(patientId)
    return this.prisma.caregiver.create({ data: { ...dto, patientId } })
  }

  async updateCaregiver(id: string, dto: UpdateCaregiverDto) {
    const c = await this.prisma.caregiver.findUnique({ where: { id } })
    if (!c) throw new NotFoundException('Cuidador no encontrado')
    return this.prisma.caregiver.update({ where: { id }, data: dto })
  }

  async deleteCaregiver(id: string) {
    const c = await this.prisma.caregiver.findUnique({ where: { id } })
    if (!c) throw new NotFoundException('Cuidador no encontrado')
    await this.prisma.caregiver.delete({ where: { id } })
  }

  // ---- Familia y genograma (Fase 2) ----
  listFamily(patientId: string) {
    return this.prisma.familyMember.findMany({ where: { patientId }, orderBy: { name: 'asc' } })
  }

  async createFamilyMember(patientId: string, dto: CreateFamilyMemberDto, userId: string) {
    await this.assertPatient(patientId)
    return this.prisma.familyMember.create({ data: { ...dto, patientId, recordedById: userId } })
  }

  async updateFamilyMember(id: string, dto: UpdateFamilyMemberDto) {
    const f = await this.prisma.familyMember.findUnique({ where: { id } })
    if (!f) throw new NotFoundException('Familiar no encontrado')
    return this.prisma.familyMember.update({ where: { id }, data: dto })
  }

  async deleteFamilyMember(id: string) {
    const f = await this.prisma.familyMember.findUnique({ where: { id } })
    if (!f) throw new NotFoundException('Familiar no encontrado')
    await this.prisma.familyMember.delete({ where: { id } })
  }

  async getGenogram(patientId: string) {
    await this.assertPatient(patientId)
    const p = await this.prisma.patient.findUnique({ where: { id: patientId }, select: { genogram: true } })
    return p?.genogram ?? null
  }

  async setGenogram(patientId: string, genogram: Record<string, unknown>) {
    await this.assertPatient(patientId)
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { genogram: genogram as Prisma.InputJsonValue },
    })
    return { genogram }
  }

  // ---- Perfil social / vivienda (Fase 2, 1:1) ----
  getSocialProfile(patientId: string) {
    return this.prisma.socialProfile.findUnique({ where: { patientId } })
  }

  async upsertSocialProfile(patientId: string, dto: UpsertSocialProfileDto, userId: string) {
    await this.assertPatient(patientId)
    const data = { ...dto, recordedById: userId }
    return this.prisma.socialProfile.upsert({
      where: { patientId },
      update: data,
      create: { ...data, patientId },
    })
  }

  // ---- Inmunizaciones (Fase 2) ----
  listImmunizations(patientId: string) {
    return this.prisma.immunization.findMany({ where: { patientId }, orderBy: { date: 'desc' } })
  }

  async createImmunization(patientId: string, dto: CreateImmunizationDto, userId: string) {
    await this.assertPatient(patientId)
    return this.prisma.immunization.create({
      data: { ...dto, date: new Date(dto.date), patientId, recordedById: userId },
    })
  }

  async updateImmunization(id: string, dto: UpdateImmunizationDto) {
    const i = await this.prisma.immunization.findUnique({ where: { id } })
    if (!i) throw new NotFoundException('Inmunización no encontrada')
    return this.prisma.immunization.update({
      where: { id },
      data: { ...dto, ...(dto.date ? { date: new Date(dto.date) } : {}) },
    })
  }

  async deleteImmunization(id: string) {
    const i = await this.prisma.immunization.findUnique({ where: { id } })
    if (!i) throw new NotFoundException('Inmunización no encontrada')
    await this.prisma.immunization.delete({ where: { id } })
  }
}
