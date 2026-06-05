/** Usuario autenticado adjuntado a `request.user` por la estrategia JWT. */
export interface AuthenticatedUser {
  id: string
  email: string
  roles: string[] // códigos de rol (ADMIN, MEDICO, ...)
  permissions: string[] // permisos efectivos (recurso:acción)
  /** true si TODOS sus roles son de solo lectura (p. ej. Auditor). */
  isReadOnly: boolean
}
