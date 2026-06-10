import { BadRequestException, UnprocessableEntityException } from '@nestjs/common'
import { UsersAdminService } from './users-admin.service'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn() }))
import * as argon2 from 'argon2'

function build() {
  const tx: any = {
    user: { update: jest.fn().mockResolvedValue({ id: 'u1', isActive: false }) },
    refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    auditLog: { create: jest.fn() },
    visit: { findMany: jest.fn().mockResolvedValue([]) },
    visitAssignment: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    route: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
  }
  const prisma: any = {
    user: { findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
    refreshToken: { findMany: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    auditLog: { findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn().mockImplementation((arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(tx))),
  }
  return { service: new UsersAdminService(prisma), prisma, tx }
}

describe('UsersAdminService', () => {
  describe('resetPassword', () => {
    it('genera temp, revoca sesiones y marca must_change_password', async () => {
      const { service, prisma, tx } = build()
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', roles: [] })
      const res = await service.resetPassword('u1', 'olvidó', 'admin1')
      expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { revokedAt: expect.any(Date) } }))
      expect(tx.user.update.mock.calls[0][0].data.mustChangePassword).toBe(true)
      expect(res.mustChangePassword).toBe(true)
      expect(typeof res.temporaryPassword).toBe('string')
    })
  })

  describe('deactivate', () => {
    it('rechaza la auto-desactivación', async () => {
      const { service } = build()
      await expect(service.deactivate('u1', {} as any, 'u1')).rejects.toBeInstanceOf(UnprocessableEntityException)
    })

    it('rechaza desactivar al último admin', async () => {
      const { service, prisma } = build()
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', isActive: true, roles: [{ role: { code: 'ADMIN' } }] })
      prisma.user.count.mockResolvedValue(1)
      await expect(
        service.deactivate('u1', { reason: 'x'.repeat(10), reassignFutureAppointments: 'unassigned', reassignFutureRoutes: 'unassigned', notifyCoordinator: false } as any, 'admin1'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException)
    })

    it('bulk: reasigna las visitas FUTURAS al destino y desactiva', async () => {
      const { service, prisma, tx } = build()
      prisma.user.findFirst
        .mockResolvedValueOnce({ id: 'u1', isActive: true, roles: [{ role: { code: 'ENFERMERIA' } }] }) // target user
        .mockResolvedValueOnce({ id: 't1', isActive: true, roles: [{ role: { code: 'ENFERMERIA' } }] }) // reassign target
      tx.visit.findMany.mockResolvedValue([{ id: 'v1', patientId: 'p1' }])
      tx.visitAssignment.findMany.mockResolvedValue([{ id: 'va1', visitId: 'v1' }])
      tx.visitAssignment.findUnique.mockResolvedValue(null)

      const res = await service.deactivate(
        'u1',
        { reason: 'cambio de turno', reassignFutureAppointments: 'bulk', appointmentsReassignTo: 't1', reassignFutureRoutes: 'unassigned', notifyCoordinator: true } as any,
        'admin1',
      )
      expect(tx.visitAssignment.update).toHaveBeenCalledWith({ where: { id: 'va1' }, data: { userId: 't1' } })
      expect(tx.user.update.mock.calls[0][0].data).toMatchObject({ isActive: false })
      expect(res).toMatchObject({ appointmentsReassigned: 1, patientsReassigned: 1, routesReassigned: 0 })
      // la consulta de visitas filtra por fecha futura
      expect(tx.visit.findMany.mock.calls[0][0].where.scheduledDate.gte).toBeInstanceOf(Date)
    })
  })

  describe('updateMe', () => {
    it('rechaza nueva contraseña sin la actual', async () => {
      const { service, prisma } = build()
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: 'h' })
      await expect(service.updateMe('u1', { newPassword: 'Abc12345!' })).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rechaza si la contraseña actual es incorrecta', async () => {
      const { service, prisma } = build()
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: 'h' })
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)
      await expect(
        service.updateMe('u1', { currentPassword: 'bad', newPassword: 'Abc12345!' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('activity', () => {
    it('filtra el audit log por el usuario', async () => {
      const { service, prisma } = build()
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', roles: [] })
      prisma.auditLog.findMany.mockResolvedValue([{ id: 'al1' }])
      prisma.auditLog.count.mockResolvedValue(1)
      const res = await service.activity('u1', { action: 'UPDATE' } as any)
      expect(prisma.auditLog.findMany.mock.calls[0][0].where).toMatchObject({ actorId: 'u1', action: 'UPDATE' })
      expect(res).toMatchObject({ total: 1, page: 1 })
    })
  })
})
