import { BadRequestException } from '@nestjs/common'
import { RoutesService } from './routes.service'

function build() {
  const repo: any = {
    findById: jest.fn().mockResolvedValue({ id: 'r1', status: 'DRAFT', stops: [] }),
    userWithAnyRoleExists: jest.fn(),
    assignClinicalTeam: jest.fn().mockResolvedValue({ id: 'r1' }),
  }
  const drivers: any = {}
  const prisma: any = {}
  const whatsapp: any = {}
  return { service: new RoutesService(repo, drivers, prisma, whatsapp), repo }
}

describe('RoutesService.assignClinicalTeam', () => {
  it('asigna médico válido (MEDICO/COORDINADOR_MEDICO) y enfermera válida', async () => {
    const { service, repo } = build()
    repo.userWithAnyRoleExists.mockResolvedValue({ id: 'u' })
    await service.assignClinicalTeam('r1', { medicalId: 'm1', nursingId: 'n1' } as any)
    expect(repo.userWithAnyRoleExists).toHaveBeenCalledWith('m1', ['MEDICO', 'COORDINADOR_MEDICO'])
    expect(repo.userWithAnyRoleExists).toHaveBeenCalledWith('n1', ['ENFERMERIA'])
    expect(repo.assignClinicalTeam).toHaveBeenCalledWith('r1', { medicalId: 'm1', nursingId: 'n1' })
  })

  it('rechaza si el médico asignado no tiene rol válido', async () => {
    const { service, repo } = build()
    repo.userWithAnyRoleExists.mockResolvedValue(null)
    await expect(
      service.assignClinicalTeam('r1', { medicalId: 'x' } as any),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.assignClinicalTeam).not.toHaveBeenCalled()
  })

  it('permite desasignar (null) sin validar rol', async () => {
    const { service, repo } = build()
    await service.assignClinicalTeam('r1', { medicalId: null, nursingId: null } as any)
    expect(repo.userWithAnyRoleExists).not.toHaveBeenCalled()
    expect(repo.assignClinicalTeam).toHaveBeenCalledWith('r1', { medicalId: null, nursingId: null })
  })
})
