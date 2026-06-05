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
  return { service: new PatientsService(repo), repo }
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
    it('genera MRN secuencial del año y crea con estado pendiente', async () => {
      const { service, repo } = build()
      repo.create.mockResolvedValue({ id: 'p', mrn: 'X' })
      await service.create(dto)
      const arg = repo.create.mock.calls[0][0]
      expect(arg.mrn).toMatch(/^PAL-\d{4}-0001$/)
      expect(arg.status).toBe('PENDING_APPROVAL')
    })

    it('mapea P2002 a ConflictException', async () => {
      const { service, repo } = build()
      repo.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '7' }),
      )
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('approve', () => {
    it('PENDING_APPROVAL → ACTIVE e inicia la cadencia', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'PENDING_APPROVAL' })
      repo.changeStatus.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      await service.approve('p', 'u1')
      const arg = repo.changeStatus.mock.calls[0][0]
      expect(arg.to).toBe('ACTIVE')
      expect(arg.patientUpdate.nextRegularVisitDue).toBeInstanceOf(Date)
    })

    it('rechaza si no está pendiente', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      await expect(service.approve('p', 'u1')).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('changeStatus', () => {
    it('rechaza transición inválida', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      await expect(
        service.changeStatus('p', { status: 'PENDING_APPROVAL' } as any, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('DECEASED sella deceasedAt', async () => {
      const { service, repo } = build()
      repo.findById.mockResolvedValue({ id: 'p', status: 'ACTIVE' })
      repo.changeStatus.mockResolvedValue({ id: 'p', status: 'DECEASED' })
      await service.changeStatus('p', { status: 'DECEASED' } as any, 'u1')
      const arg = repo.changeStatus.mock.calls[0][0]
      expect(arg.to).toBe('DECEASED')
      expect(arg.patientUpdate.deceasedAt).toBeInstanceOf(Date)
    })
  })
})
