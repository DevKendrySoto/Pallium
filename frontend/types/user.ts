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

export interface UserDetail {
  id: string
  email: string
  fullName: string
  phone: string | null
  specialty: string | null
  isActive: boolean
  mustChangePassword: boolean
  passwordChangedAt: string | null
  lastLoginAt: string | null
  deactivatedAt: string | null
  deactivationReason: string | null
  createdAt: string
  updatedAt: string
  roles: { code: string; name: string }[]
  _count: { refreshTokens: number }
}

export interface UserSession {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastActivityAt: string | null
  revokedAt: string | null
  active: boolean
}

export interface UserActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string | null
  createdAt: string
  ipAddress: string | null
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
