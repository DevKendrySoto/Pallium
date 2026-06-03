import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import type { AuthenticatedUser } from '../types/authenticated-user'

/**
 * Autorización por permisos. Corre después de JwtAuthGuard.
 * Requiere que el usuario tenga TODOS los permisos declarados con @RequirePermissions.
 * ADMIN (permiso comodín en el seed) los tiene todos por construcción.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    if (!user) throw new ForbiddenException('Usuario no autenticado')

    const granted = new Set(user.permissions)
    const missing = required.filter((p) => !granted.has(p))
    if (missing.length > 0) {
      throw new ForbiddenException(`Faltan permisos: ${missing.join(', ')}`)
    }
    return true
  }
}
