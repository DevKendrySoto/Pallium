import { ConflictException, NotFoundException } from '@nestjs/common'
import { CategoriesService } from './categories.service'

function build() {
  const prisma: any = {
    patientCategory: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'c1' }),
      update: jest.fn().mockResolvedValue({ id: 'c1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  }
  return { service: new CategoriesService(prisma), prisma }
}

describe('CategoriesService', () => {
  it('normaliza el código a mayúsculas al crear', async () => {
    const { service, prisma } = build()
    prisma.patientCategory.findUnique.mockResolvedValue(null)
    await service.create({ code: ' onco ', name: 'Oncológico' } as any)
    expect(prisma.patientCategory.findUnique).toHaveBeenCalledWith({ where: { code: 'ONCO' } })
    expect(prisma.patientCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: 'ONCO', name: 'Oncológico', description: null }) }),
    )
  })

  it('rechaza crear si el código ya existe', async () => {
    const { service, prisma } = build()
    prisma.patientCategory.findUnique.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ code: 'ONCO', name: 'Oncológico' } as any)).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.patientCategory.create).not.toHaveBeenCalled()
  })

  it('actualiza solo los campos provistos', async () => {
    const { service, prisma } = build()
    prisma.patientCategory.findUnique.mockResolvedValue({ id: 'c1' })
    await service.update('c1', { isActive: false } as any)
    expect(prisma.patientCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'c1' }, data: { isActive: false } }),
    )
  })

  it('lanza NotFound al actualizar una categoría inexistente', async () => {
    const { service, prisma } = build()
    prisma.patientCategory.findUnique.mockResolvedValue(null)
    await expect(service.update('nope', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.patientCategory.update).not.toHaveBeenCalled()
  })
})
