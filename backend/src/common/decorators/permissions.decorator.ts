import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'requiredPermissions'

/**
 * Exige uno o más permisos (`recurso:acción`) para acceder a la ruta.
 * El usuario debe tener TODOS los permisos listados.
 * @example @RequirePermissions('patient:read', 'patient:update')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
