import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/** Acceso a datos de usuarios. Sin lógica de negocio. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Incluye roles y permisos para construir el contexto de autorización. */
  private readonly authInclude = {
    roles: {
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    },
  } as const

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: this.authInclude,
    })
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: this.authInclude,
    })
  }

  touchLastLogin(id: string, when: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: when },
    })
  }
}

/** Tipo del usuario con su grafo de autorización cargado. */
export type UserWithAuth = NonNullable<Awaited<ReturnType<UsersRepository['findByEmail']>>>
