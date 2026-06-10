import { randomBytes } from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRequestStatus } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import type {
  ApproveUserRequestDto,
  CreateUserRequestDto,
  RejectUserRequestDto,
} from './dto/user-request.dto'

function generateTempPassword(): string {
  // Legible y >= 8 caracteres; el usuario debe cambiarla en el primer login.
  return `Pallium-${randomBytes(4).toString('hex')}`
}

@Injectable()
export class UserRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea una solicitud de alta (coordinador). Valida que el rol exista. */
  async create(dto: CreateUserRequestDto, requesterId: string) {
    const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode }, select: { id: true } })
    if (!role) throw new BadRequestException('El rol indicado no existe')
    return this.prisma.userRequest.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        roleCode: dto.roleCode,
        reason: dto.reason,
        requestedBy: { connect: { id: requesterId } },
      },
    })
  }

  list(status: UserRequestStatus = UserRequestStatus.PENDING) {
    return this.prisma.userRequest.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      include: { requestedBy: { select: { id: true, fullName: true } } },
    })
  }

  private async getPending(id: string) {
    const req = await this.prisma.userRequest.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('Solicitud no encontrada')
    if (req.status !== UserRequestStatus.PENDING) {
      throw new BadRequestException('La solicitud ya fue revisada')
    }
    return req
  }

  /** Aprueba: crea el usuario con contraseña temporal y must_change_password. */
  async approve(id: string, dto: ApproveUserRequestDto, adminId: string) {
    const req = await this.getPending(id)
    const roleCode = dto.roleCode ?? req.roleCode
    const role = await this.prisma.role.findUnique({ where: { code: roleCode }, select: { id: true } })
    if (!role) throw new BadRequestException('El rol indicado no existe')

    const existing = await this.prisma.user.findUnique({ where: { email: req.email }, select: { id: true } })
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo')

    const temporaryPassword = generateTempPassword()
    const user = await this.prisma.user.create({
      data: {
        email: req.email,
        fullName: req.fullName,
        passwordHash: await argon2.hash(temporaryPassword),
        mustChangePassword: true,
        isActive: true,
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, email: true },
    })

    await this.prisma.userRequest.update({
      where: { id },
      data: {
        status: UserRequestStatus.APPROVED,
        reviewedBy: { connect: { id: adminId } },
        reviewedAt: new Date(),
        createdUserId: user.id,
      },
    })

    return {
      userId: user.id,
      email: user.email,
      temporaryPassword,
      mustChangePassword: true,
    }
  }

  async reject(id: string, dto: RejectUserRequestDto, adminId: string) {
    await this.getPending(id)
    return this.prisma.userRequest.update({
      where: { id },
      data: {
        status: UserRequestStatus.REJECTED,
        reviewedBy: { connect: { id: adminId } },
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      select: { id: true, status: true },
    })
  }
}
