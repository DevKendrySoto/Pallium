import { Injectable } from '@nestjs/common'
import { type Prisma, type Specialty, TimelineEventType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const recordInclude = {
  author: { select: { id: true, fullName: true, specialty: true } },
  medicalNote: true,
  nursingNote: true,
  psychologyNote: true,
  socialWorkNote: true,
  physiotherapyNote: true,
  vitalSigns: true,
} satisfies Prisma.ClinicalRecordInclude

@Injectable()
export class ClinicalRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea el registro (con su nota y vitales) y deja evento en el timeline. */
  create(data: Prisma.ClinicalRecordCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.clinicalRecord.create({ data, include: recordInclude })
      await tx.timelineEvent.create({
        data: {
          patientId: record.patientId,
          type: TimelineEventType.CLINICAL_NOTE,
          title: `Nota clínica — ${record.specialty}`,
          description: record.summary,
          occurredAt: record.recordedAt,
          actorId: record.authorId,
          sourceType: 'clinical_record',
          sourceId: record.id,
        },
      })
      return record
    })
  }

  findById(id: string) {
    return this.prisma.clinicalRecord.findFirst({
      where: { id, deletedAt: null },
      include: recordInclude,
    })
  }

  listByPatient(patientId: string, specialty?: Specialty) {
    return this.prisma.clinicalRecord.findMany({
      where: { patientId, deletedAt: null, ...(specialty && { specialty }) },
      include: recordInclude,
      orderBy: { recordedAt: 'desc' },
    })
  }
}
