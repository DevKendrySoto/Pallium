import { randomBytes } from 'node:crypto'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { AuditAction, type Prisma, VisitStatus } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import type { ActivityQueryDto, DeactivateUserDto } from './dto/user-admin.dto'

const ADMIN_ROLE = 'ADMIN'
const ACTIVE_VISIT_STATUSES = [
  VisitStatus.SCHEDULED,
  VisitStatus.CONFIRMED,
  VisitStatus.EN_ROUTE,
  VisitStatus.IN_PROGRESS,
]

function generateTempPassword(): string {
  return `Pallium-${randomBytes(4).toString('hex')}`
}
function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { select: { role: { select: { code: true } } } } },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  private rolesOf(user: { roles: { role: { code: string } }[] }): string[] {
    return user.roles.map((r) => r.role.code)
  }

  private audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    entityId: string,
    before: Prisma.InputJsonValue,
    after: Prisma.InputJsonValue,
  ) {
    return tx.auditLog.create({
      data: { actorId, action: AuditAction.UPDATE, entityType: 'User', entityId, before, after },
    })
  }

  /** Detalle completo de un usuario (para el admin). */
  async detail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        specialty: true,
        isActive: true,
        mustChangePassword: true,
        passwordChangedAt: true,
        lastLoginAt: true,
        deactivatedAt: true,
        deactivationReason: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { code: true, name: true } } } },
        _count: { select: { refreshTokens: { where: { revokedAt: null } } } },
      },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  // ===== Sesiones (RefreshToken) =====

  async listSessions(userId: string) {
    await this.getUserOrThrow(userId)
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, revokedAt: true, expiresAt: true },
    })
    return tokens.map((t) => ({
      id: t.id,
      ip: t.ipAddress,
      userAgent: t.userAgent,
      createdAt: t.createdAt,
      lastActivityAt: null,
      revokedAt: t.revokedAt,
      active: !t.revokedAt && t.expiresAt > new Date(),
    }))
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({ where: { id: sessionId, userId } })
    if (!session) throw new NotFoundException('Sesión no encontrada')
    return this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
      select: { id: true, revokedAt: true },
    })
  }

  async revokeAllSessions(userId: string) {
    await this.getUserOrThrow(userId)
    const res = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return { revoked: res.count }
  }

  // ===== Reset de contraseña =====

  async resetPassword(userId: string, reason: string, adminId: string) {
    await this.getUserOrThrow(userId)
    const temporaryPassword = generateTempPassword()
    const passwordHash = await argon2.hash(temporaryPassword)
    const now = new Date()
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: true, passwordChangedAt: now },
      })
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } })
      await this.audit(tx, adminId, userId, { action: 'reset-password' }, { reason, mustChangePassword: true })
    })
    return { temporaryPassword, mustChangePassword: true }
  }

  // ===== Conteo de admins activos =====

  async adminCount() {
    const activeAdmins = await this.prisma.user.count({
      where: { isActive: true, deletedAt: null, roles: { some: { role: { code: ADMIN_ROLE } } } },
    })
    return { activeAdmins }
  }

  // ===== Activar / Desactivar =====

  async activate(userId: string, adminId: string) {
    const user = await this.getUserOrThrow(userId)
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: true, deactivatedAt: null, deactivationReason: null },
        select: { id: true, isActive: true },
      })
      await this.audit(tx, adminId, userId, { isActive: user.isActive }, { isActive: true })
      return updated
    })
  }

  async deactivate(userId: string, dto: DeactivateUserDto, adminId: string) {
    if (userId === adminId) {
      throw new UnprocessableEntityException('No puedes desactivar tu propia cuenta')
    }
    const user = await this.getUserOrThrow(userId)
    const roles = this.rolesOf(user)

    if (roles.includes(ADMIN_ROLE)) {
      const { activeAdmins } = await this.adminCount()
      if (activeAdmins <= 1) {
        throw new UnprocessableEntityException('No puedes desactivar al último administrador activo')
      }
    }

    await this.assertReassignTarget(dto.reassignFutureAppointments, dto.appointmentsReassignTo, roles)
    await this.assertReassignTarget(dto.reassignFutureRoutes, dto.routesReassignTo, roles)

    const now = new Date()
    const summary = await this.prisma.$transaction(async (tx) => {
      const appt = await this.reassignFutureAppointments(tx, userId, now, dto)
      const routes = await this.reassignFutureRoutes(tx, userId, now, dto)

      await tx.user.update({
        where: { id: userId },
        data: { isActive: false, deactivatedAt: now, deactivationReason: dto.reason },
      })
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } })
      await this.audit(
        tx,
        adminId,
        userId,
        { isActive: true },
        { isActive: false, reason: dto.reason, ...appt, routesReassigned: routes },
      )

      return {
        patientsReassigned: appt.patientsReassigned,
        appointmentsReassigned: appt.appointmentsReassigned,
        routesReassigned: routes,
        // Las alertas a coordinación requieren un sistema de notificaciones por usuario (no existe aún).
        alertsCreated: 0,
      }
    })
    return summary
  }

  private async assertReassignTarget(mode: string, targetId: string | undefined, sourceRoles: string[]) {
    if (mode !== 'bulk') return
    if (!targetId) throw new BadRequestException('Falta el usuario destino para la reasignación')
    const target = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null, isActive: true },
      include: { roles: { select: { role: { select: { code: true } } } } },
    })
    if (!target) throw new BadRequestException('El usuario destino no existe o no está activo')
    const shares = this.rolesOf(target).some((r) => sourceRoles.includes(r))
    if (!shares) throw new BadRequestException('El usuario destino debe tener el mismo rol')
  }

  private async reassignFutureAppointments(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
    dto: DeactivateUserDto,
  ) {
    const visits = await tx.visit.findMany({
      where: {
        scheduledDate: { gte: now },
        status: { in: ACTIVE_VISIT_STATUSES },
        assignments: { some: { userId } },
      },
      select: { id: true, patientId: true },
    })
    const visitIds = visits.map((v) => v.id)
    const assignments = await tx.visitAssignment.findMany({
      where: { userId, visitId: { in: visitIds } },
      select: { id: true, visitId: true },
    })
    const target = dto.appointmentsReassignTo
    for (const a of assignments) {
      if (dto.reassignFutureAppointments === 'bulk' && target) {
        const exists = await tx.visitAssignment.findUnique({
          where: { visitId_userId: { visitId: a.visitId, userId: target } },
          select: { id: true },
        })
        if (exists) await tx.visitAssignment.delete({ where: { id: a.id } })
        else await tx.visitAssignment.update({ where: { id: a.id }, data: { userId: target } })
      } else {
        await tx.visitAssignment.delete({ where: { id: a.id } })
      }
    }
    return {
      appointmentsReassigned: assignments.length,
      patientsReassigned: new Set(visits.map((v) => v.patientId)).size,
    }
  }

  private async reassignFutureRoutes(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
    dto: DeactivateUserDto,
  ): Promise<number> {
    const routes = await tx.route.findMany({
      where: {
        routeDate: { gte: startOfDay(now) },
        OR: [{ assignedMedicalId: userId }, { assignedNursingId: userId }],
      },
      select: { id: true, assignedMedicalId: true, assignedNursingId: true },
    })
    const target = dto.reassignFutureRoutes === 'bulk' ? (dto.routesReassignTo ?? null) : null
    for (const r of routes) {
      await tx.route.update({
        where: { id: r.id },
        data: {
          ...(r.assignedMedicalId === userId && { assignedMedicalId: target }),
          ...(r.assignedNursingId === userId && { assignedNursingId: target }),
        },
      })
    }
    return routes.length
  }

  // ===== Perfil propio =====

  async updateMe(
    userId: string,
    dto: { fullName?: string; phone?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, passwordHash: true },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')

    const data: Prisma.UserUpdateInput = {}
    if (dto.fullName !== undefined) data.fullName = dto.fullName
    if (dto.phone !== undefined) data.phone = dto.phone

    let changedPassword = false
    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Falta la contraseña actual')
      const ok = await argon2.verify(user.passwordHash, dto.currentPassword)
      if (!ok) throw new BadRequestException('La contraseña actual no es correcta')
      data.passwordHash = await argon2.hash(dto.newPassword)
      data.passwordChangedAt = new Date()
      data.mustChangePassword = false
      changedPassword = true
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data,
        select: { id: true, fullName: true, phone: true, mustChangePassword: true },
      })
      await this.audit(tx, userId, userId, { self: true }, { changedPassword, fullName: dto.fullName ?? null })
      return u
    })
    return updated
  }

  // ===== Actividad (AuditLog) =====

  async activity(userId: string, q: ActivityQueryDto) {
    await this.getUserOrThrow(userId)
    const page = q.page ?? 1
    const pageSize = Math.min(q.pageSize ?? 20, 100)
    const where: Prisma.AuditLogWhereInput = {
      actorId: userId,
      ...(q.action && { action: q.action }),
      ...((q.dateFrom || q.dateTo) && {
        createdAt: {
          ...(q.dateFrom && { gte: new Date(q.dateFrom) }),
          ...(q.dateTo && { lte: new Date(q.dateTo) }),
        },
      }),
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, ipAddress: true },
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { items, total, page, pageSize }
  }
}
