import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateUserDto, UpdateUserDto } from './dto/user.dto'

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  specialty: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  roles: { include: { role: { select: { code: true, name: true } } } },
} satisfies Prisma.UserSelect

@Injectable()
export class UsersManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private shape<T extends { roles: { role: { code: string; name: string } }[] }>(u: T) {
    return { ...u, roles: u.roles.map((r) => r.role) }
  }

  async list() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { fullName: 'asc' },
    })
    return users.map((u) => this.shape(u))
  }

  listRoles() {
    return this.prisma.role.findMany({
      select: { code: true, name: true, description: true, isReadOnly: true },
      orderBy: { name: 'asc' },
    })
  }

  private async resolveRoles(codes: string[]) {
    const roles = await this.prisma.role.findMany({ where: { code: { in: codes } } })
    if (roles.length !== codes.length) throw new BadRequestException('Uno o más roles no existen')
    return roles
  }

  async create(dto: CreateUserDto) {
    const roles = await this.resolveRoles(dto.roleCodes)
    const passwordHash = await argon2.hash(dto.password)
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          specialty: dto.specialty,
          phone: dto.phone,
          isActive: true,
          roles: { create: roles.map((r) => ({ roleId: r.id })) },
        },
        select: userSelect,
      })
      return this.shape(user)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese correo')
      }
      throw e
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!existing) throw new NotFoundException('Usuario no encontrado')

    if (dto.roleCodes) {
      const roles = await this.resolveRoles(dto.roleCodes)
      await this.prisma.$transaction([
        this.prisma.userRole.deleteMany({ where: { userId: id } }),
        this.prisma.userRole.createMany({ data: roles.map((r) => ({ userId: id, roleId: r.id })) }),
      ])
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { fullName: dto.fullName, isActive: dto.isActive, specialty: dto.specialty },
      select: userSelect,
    })
    return this.shape(user)
  }
}
