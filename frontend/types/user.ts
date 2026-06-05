export interface RoleInfo {
  code: string
  name: string
  description?: string | null
  isReadOnly?: boolean
}

export interface ManagedUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  specialty: string | null
  isActive: boolean
  lastLoginAt: string | null
  roles: { code: string; name: string }[]
}

export interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  createdAt: string
  actor: { id: string; fullName: string; email: string } | null
}
