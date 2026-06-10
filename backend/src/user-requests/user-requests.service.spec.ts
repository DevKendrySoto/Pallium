import { BadRequestException, ConflictException } from '@nestjs/common'
import { UserRequestsService } from './user-requests.service'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

function build() {
  const prisma: any = {
    role: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn() },
    userRequest: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  }
  return { service: new UserRequestsService(prisma), prisma }
}

describe('UserRequestsService', () => {
  describe('create', () => {
    it('rechaza si el rol no existe', async () => {
      const { service, prisma } = build()
      prisma.role.findUnique.mockResolvedValue(null)
      await expect(
        service.create({ fullName: 'Ana', email: 'a@x.com', roleCode: 'NOPE' } as any, 'coord1'),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('crea la solicitud cuando el rol existe', async () => {
      const { service, prisma } = build()
      prisma.role.findUnique.mockResolvedValue({ id: 'r1' })
      prisma.userRequest.create.mockResolvedValue({ id: 'req1' })
      const out = await service.create({ fullName: 'Ana', email: 'a@x.com', roleCode: 'MEDICO' } as any, 'coord1')
      expect(out).toEqual({ id: 'req1' })
      expect(prisma.userRequest.create).toHaveBeenCalled()
    })
  })

  describe('approve', () => {
    it('crea el usuario con must_change_password y devuelve clave temporal', async () => {
      const { service, prisma } = build()
      prisma.userRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'PENDING', roleCode: 'MEDICO', email: 'a@x.com', fullName: 'Ana' })
      prisma.role.findUnique.mockResolvedValue({ id: 'r1' })
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@x.com' })
      prisma.userRequest.update.mockResolvedValue({})

      const res = await service.approve('req1', {} as any, 'admin1')

      const created = prisma.user.create.mock.calls[0][0].data
      expect(created.mustChangePassword).toBe(true)
      expect(created.roles.create.roleId).toBe('r1')
      expect(res.mustChangePassword).toBe(true)
      expect(typeof res.temporaryPassword).toBe('string')
      expect(res.temporaryPassword.length).toBeGreaterThanOrEqual(8)
      expect(res.userId).toBe('u1')
    })

    it('rechaza si la solicitud ya fue revisada', async () => {
      const { service, prisma } = build()
      prisma.userRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'APPROVED' })
      await expect(service.approve('req1', {} as any, 'admin1')).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rechaza si el correo ya existe', async () => {
      const { service, prisma } = build()
      prisma.userRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'PENDING', roleCode: 'MEDICO', email: 'a@x.com', fullName: 'Ana' })
      prisma.role.findUnique.mockResolvedValue({ id: 'r1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' })
      await expect(service.approve('req1', {} as any, 'admin1')).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('reject', () => {
    it('marca como rechazada con motivo', async () => {
      const { service, prisma } = build()
      prisma.userRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'PENDING' })
      prisma.userRequest.update.mockResolvedValue({ id: 'req1', status: 'REJECTED' })
      await service.reject('req1', { reason: 'no procede' } as any, 'admin1')
      expect(prisma.userRequest.update.mock.calls[0][0].data.status).toBe('REJECTED')
    })
  })
})
