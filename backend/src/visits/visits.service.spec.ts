import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { VisitsService } from './visits.service'

function build() {
  const repo: any = {
    findById: jest.fn(),
    create: jest.fn(),
    transition: jest.fn(),
    completeVisit: jest.fn(),
  }
  const prisma: any = {
    patient: { findFirst: jest.fn(), update: jest.fn() },
    timelineEvent: { create: jest.fn() },
    clinicalRecord: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    visit: { update: jest.fn() },
    $transaction: jest.fn(),
  }
  const alerts: any = { raise: jest.fn() }
  const service = new VisitsService(repo, prisma, alerts)
  return { service, repo, prisma, alerts }
}

const medico = { id: 'u1', email: 'm@x', roles: ['MEDICO'], permissions: [], isReadOnly: false }
const enfermeria = { id: 'u2', email: 'e@x', roles: ['ENFERMERIA'], permissions: [], isReadOnly: false }

describe('VisitsService', () => {
  describe('create', () => {
    it('rechaza extraordinaria sin motivo', async () => {
      const { service } = build()
      await expect(
        service.create({ patientId: 'p', type: 'EXTRAORDINARY', scheduledDate: '2026-06-10T09:00:00Z' } as any),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rechaza regular con motivo', async () => {
      const { service } = build()
      await expect(
        service.create({ patientId: 'p', type: 'REGULAR', reason: 'EMERGENCY', scheduledDate: '2026-06-10T09:00:00Z' } as any),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('crea una visita regular válida y registra el timeline', async () => {
      const { service, repo, prisma } = build()
      prisma.patient.findFirst.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      repo.create.mockResolvedValue({ id: 'v', patientId: 'p' })
      const out = await service.create({ patientId: 'p', type: 'REGULAR', scheduledDate: '2026-06-10T09:00:00Z' } as any)
      expect(out).toEqual({ id: 'v', patientId: 'p' })
      expect(repo.create).toHaveBeenCalledTimes(1)
      expect(prisma.timelineEvent.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('checkIn', () => {
    it('pasa a IN_PROGRESS con geolocalización', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'CONFIRMED', patientId: 'p' })
      await service.checkIn('v', { latitude: 18.4, longitude: -69.9 } as any)
      expect(repo.transition).toHaveBeenCalledWith(
        expect.objectContaining({
          visitId: 'v',
          to: 'IN_PROGRESS',
          extra: expect.objectContaining({ checkInLat: 18.4, checkInLng: -69.9 }),
        }),
      )
    })
  })

  describe('close', () => {
    it('COMPLETED delega en completeVisit', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'IN_PROGRESS', patientId: 'p', type: 'REGULAR' })
      repo.completeVisit.mockResolvedValue({ id: 'v', status: 'COMPLETED' })
      await service.close('v', { outcome: 'COMPLETED' } as any)
      expect(repo.completeVisit).toHaveBeenCalledTimes(1)
    })

    it('REFUSED → NO_SHOW, incrementa rehúsos y levanta alerta', async () => {
      const { service, repo, prisma, alerts } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'IN_PROGRESS', patientId: 'p', type: 'REGULAR' })
      const tx = {
        visit: { update: jest.fn().mockResolvedValue({ id: 'v' }) },
        timelineEvent: { create: jest.fn() },
        patient: { update: jest.fn() },
      }
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx))
      await service.close('v', { outcome: 'REFUSED', reason: 'no desea' } as any)
      expect(tx.patient.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { refusalCount: { increment: 1 } } }),
      )
      expect(alerts.raise).toHaveBeenCalledTimes(1)
      expect(repo.completeVisit).not.toHaveBeenCalled()
    })
  })

  describe('saveClinicalRecord (seguridad)', () => {
    it('B1: rechaza nota de otra especialidad', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'IN_PROGRESS', signedAt: null, patientId: 'p' })
      await expect(
        service.saveClinicalRecord('v', { specialty: 'MEDICINE', data: {} } as any, enfermeria as any),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('B2: rechaza si la visita está cerrada/firmada', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'COMPLETED', signedAt: null, patientId: 'p' })
      await expect(
        service.saveClinicalRecord('v', { specialty: 'MEDICINE', data: {} } as any, medico as any),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('crea el registro cuando rol y estado son válidos', async () => {
      const { service, repo, prisma } = build()
      repo.findById.mockResolvedValue({ id: 'v', status: 'IN_PROGRESS', signedAt: null, patientId: 'p' })
      prisma.clinicalRecord.findFirst.mockResolvedValue(null)
      prisma.clinicalRecord.create.mockResolvedValue({ id: 'rec1' })
      const out = await service.saveClinicalRecord('v', { specialty: 'MEDICINE', data: { sections: {} } } as any, medico as any)
      expect(out).toEqual({ id: 'rec1' })
      expect(prisma.clinicalRecord.create).toHaveBeenCalledTimes(1)
    })
  })
})
