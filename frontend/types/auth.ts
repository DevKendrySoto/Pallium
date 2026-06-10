/** Roles del sistema (códigos que devuelve el backend). */
export type Role =
  | 'ADMIN'
  | 'AGENDA'
  | 'MEDICO'
  | 'ENFERMERIA'
  | 'PSICOLOGIA'
  | 'TRABAJO_SOCIAL'
  | 'FISIATRA'
  | 'AUDITOR'

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  roles: Role[]
  permissions: string[]
  isReadOnly?: boolean
  mustChangePassword?: boolean
}
