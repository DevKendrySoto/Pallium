import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { UsersRepository, type UserWithAuth } from './users.repository'

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  findByEmail(email: string) {
    return this.repo.findByEmail(email)
  }

  findById(id: string) {
    return this.repo.findById(id)
  }

  touchLastLogin(id: string) {
    return this.repo.touchLastLogin(id, new Date())
  }

  /** Aplana roles y permisos efectivos (deduplicados) para el JWT / contexto. */
  toAuthContext(user: UserWithAuth): AuthenticatedUser {
    const roles = user.roles.map((ur) => ur.role.code)
    const permissions = new Set<string>()
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.code)
      }
    }
    // Solo lectura si tiene roles y todos son de solo lectura (p. ej. Auditor).
    const isReadOnly = user.roles.length > 0 && user.roles.every((ur) => ur.role.isReadOnly)
    return {
      id: user.id,
      email: user.email,
      roles,
      permissions: [...permissions],
      isReadOnly,
      mustChangePassword: user.mustChangePassword,
    }
  }
}
