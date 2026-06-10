import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { ClinicalTemplatesService } from './clinical-templates.service'

function build() {
  const prisma: any = {
    clinicalTemplate: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 't1' }),
      update: jest.fn().mockResolvedValue({ id: 't1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  }
  return { service: new ClinicalTemplatesService(prisma), prisma }
}

const sections = [{ key: 'eval', title: 'Evaluación', components: [{ type: 'VitalSignsBlock', key: 'v', config: {} }] }]

describe('ClinicalTemplatesService admin', () => {
  it('crea una plantilla válida normalizando la clave', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue(null)
    await service.create({ key: ' Medical_Adult ', name: 'Médico adulto', sections } as any)
    expect(prisma.clinicalTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ key: 'medical_adult', version: 1 }) }),
    )
  })

  it('rechaza crear con sections inválidas (BadRequest)', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue(null)
    await expect(
      service.create({ key: 'x', name: 'Mala', sections: [{ key: 's', title: 'S', components: [{ type: 'Nope', key: 'n', config: {} }] }] } as any),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.clinicalTemplate.create).not.toHaveBeenCalled()
  })

  it('rechaza crear si la clave ya existe', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ key: 'medical_adult', name: 'X', sections } as any)).rejects.toBeInstanceOf(ConflictException)
  })

  it('sube la versión cuando se editan las sections', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue({ id: 't1', key: 'medical_adult', version: 3 })
    await service.update('medical_adult', { sections } as any)
    expect(prisma.clinicalTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 4 }) }),
    )
  })

  it('no sube la versión si solo cambia metadata', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue({ id: 't1', key: 'medical_adult', version: 3 })
    await service.update('medical_adult', { isActive: false } as any)
    const data = prisma.clinicalTemplate.update.mock.calls[0][0].data
    expect(data.version).toBeUndefined()
    expect(data.isActive).toBe(false)
  })

  it('lanza NotFound al actualizar una plantilla inexistente', async () => {
    const { service, prisma } = build()
    prisma.clinicalTemplate.findUnique.mockResolvedValue(null)
    await expect(service.update('zzz', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException)
  })
})
