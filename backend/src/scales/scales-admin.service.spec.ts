import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { ScaleCategory } from '@prisma/client'
import { ScalesService } from './scales.service'

function build() {
  const repo: any = {
    findDefinitionByCode: jest.fn(),
    listAllDefinitions: jest.fn().mockResolvedValue([]),
    createDefinition: jest.fn().mockResolvedValue({ id: 's1' }),
    updateDefinition: jest.fn().mockResolvedValue({ id: 's1' }),
  }
  const prisma: any = {}
  const alerts: any = {}
  return { service: new ScalesService(repo, prisma, alerts), repo }
}

const validSchema = { type: 'single-select', options: [{ value: 100, label: 'Normal' }] }

describe('ScalesService admin', () => {
  it('crea una escala válida normalizando el código', async () => {
    const { service, repo } = build()
    repo.findDefinitionByCode.mockResolvedValue(null)
    await service.createDefinition({ code: ' kps ', name: 'Karnofsky', category: ScaleCategory.FUNCTIONAL, schema: validSchema } as any)
    expect(repo.createDefinition).toHaveBeenCalledWith(expect.objectContaining({ code: 'KPS', name: 'Karnofsky' }))
  })

  it('rechaza crear con schema inválido (BadRequest) sin tocar el repo', async () => {
    const { service, repo } = build()
    repo.findDefinitionByCode.mockResolvedValue(null)
    await expect(
      service.createDefinition({ code: 'X', name: 'Mala', category: ScaleCategory.FUNCTIONAL, schema: { type: 'nope' } } as any),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.createDefinition).not.toHaveBeenCalled()
  })

  it('rechaza crear si el código ya existe', async () => {
    const { service, repo } = build()
    repo.findDefinitionByCode.mockResolvedValue({ id: 'dup' })
    await expect(
      service.createDefinition({ code: 'KPS', name: 'Karnofsky', category: ScaleCategory.FUNCTIONAL, schema: validSchema } as any),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('actualiza metadata sin revalidar schema si no se envía', async () => {
    const { service, repo } = build()
    repo.findDefinitionByCode.mockResolvedValue({ id: 's1', code: 'KPS' })
    await service.updateDefinition('KPS', { isActive: false } as any)
    expect(repo.updateDefinition).toHaveBeenCalledWith('KPS', { isActive: false })
  })

  it('lanza NotFound al actualizar una escala inexistente', async () => {
    const { service, repo } = build()
    repo.findDefinitionByCode.mockResolvedValue(null)
    await expect(service.updateDefinition('ZZZ', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException)
    expect(repo.updateDefinition).not.toHaveBeenCalled()
  })
})
