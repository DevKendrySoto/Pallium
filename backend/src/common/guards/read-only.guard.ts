import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../types/authenticated-user'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Defensa en profundidad: bloquea cualquier método mutante para usuarios de
 * solo lectura (Auditor), aunque algún endpoint quedara sin permiso específico.
 * Corre después de JwtAuthGuard y PermissionsGuard.
 */
@Injectable()
export class ReadOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ method: string; user?: AuthenticatedUser }>()
    if (SAFE_METHODS.has(req.method)) return true
    if (req.user?.isReadOnly) {
      throw new ForbiddenException('Rol de solo lectura: acción no permitida')
    }
    return true
  }
}
