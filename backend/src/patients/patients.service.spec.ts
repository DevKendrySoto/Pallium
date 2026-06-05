import { BadRequestException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PatientsService } from './patients.service'

function build() {
  const repo: any = {
    findById: jest.fn(),
    create: jest.fn(),
    changeStatus: jest.fn(),
    countCreatedThisYear: jest.fn().mockResolvedValue(0),
  }
  const alerts: any = { raise: jest.fn().mockResolvedValue(null) }
  return { service: new PatientsService(repo, alerts), repo, alerts }
}

const dto: any = {
  identificationType: 'CEDULA',
  identificationNo: '001-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  birthDate: '1950-01-01',
  sex: 'FEMALE',
  categoryId: 'cat1',
}

describe('PatientsService', () => {
  describe('create', () => {
    it('genera MRN secuencial del año y crea Activo con cadencia iniciada', async () => {
      const { service, repo } = build()
      repo.create.mockResolvedValue({ id: 'p', mrn: 'X' })
      await service.create(dto)
      const arg = repo.create.mock.calls[0][0]
      expect(arg.mrn).toMatch(/^PAL-\d{4}-0001$/)
      expect(arg.status).toBe('ACTIVE')
      expect(arg.admittedAt).toBeInstanceOf(Date)
      expect(arg.nextRegularVisitDue).toBeInstanceOf(Date)
    })

    it('mapea P2002 a ConflictException', async () => {
      const { service, repo } = build()
      repo.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '7' }),
      )
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('changeStatus', () => {
    it('rechaza transición inválida (PASSIVE → ... no permitido a sí mismo)', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'DECEASED' })
      await expect(
        service.changeStatus('p', { status: 'ACTIVE' } as any, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('ACTIVE → PASSIVE registra el cambio', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      repo.changeStatus.mockResolvedValue({ id: 'p', status: 'PASSIVE' })
      await service.changeStatus('p', { status: 'PASSIVE' } as any, 'u1')
      expect(repo.changeStatus.mock.calls[0][0].to).toBe('PASSIVE')
    })

    it('DECESO sin fecha/lugar/motivo es rechazado', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      await expect(
        service.changeStatus('p', { status: 'DECEASED' } as any, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repo.changeStatus).not.toHaveBeenCalled()
    })

    it('DECESO completo sella campos y levanta alerta', async () => {
      const { service, repo, alerts } = build()
      repo.findById.mockResolvedValue({
        id: 'p',
        status: 'ACTIVE',
        firstName: 'Ana',
        lastName: 'Pérez',
        mrn: 'PAL-2026-0001',
      })
      repo.changeStatus.mockResolvedValue({ id: 'p', status: 'DECEASED' })
      await service.changeStatus(
        'p',
        { status: 'DECEASED', reason: 'Causa natural', deathDate: '2026-06-01', deathPlace: 'Domicilio' } as any,
        'u1',
      )
      const arg = repo.changeStatus.mock.calls[0][0]
      expect(arg.to).toBe('DECEASED')
      expect(arg.patientUpdate.deceasedAt).toBeInstanceOf(Date)
      expect(arg.patientUpdate.deathDate).toBeInstanceOf(Date)
      expect(arg.patientUpdate.deathPlace).toBe('Domicilio')
      expect(alerts.raise).toHaveBeenCalledTimes(1)
      expect(alerts.raise.mock.calls[0][0]).toMatchObject({ type: 'ADMINISTRATIVE', severity: 'CRITICAL' })
    })
  })
})
