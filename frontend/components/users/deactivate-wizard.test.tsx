import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeactivateWizard } from './deactivate-wizard'
import type { UserDetail } from '@/types/user'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Estado de auth controlable por test.
let currentUserId = 'admin-self'
vi.mock('@/lib/auth-store', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) => sel({ user: { id: currentUserId } }),
}))

// Hooks de datos: contamos un único admin para forzar el caso "último admin".
vi.mock('@/features/users', () => ({
  useAdminCount: () => ({ data: { activeAdmins: 1 } }),
  useUsers: () => ({ data: [] }),
  useDeactivateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

function baseUser(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: 'target-1',
    email: 'x@pallium.local',
    fullName: 'Ana Pérez',
    phone: null,
    specialty: null,
    isActive: true,
    mustChangePassword: false,
    passwordChangedAt: null,
    lastLoginAt: null,
    deactivatedAt: null,
    deactivationReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    roles: [{ code: 'ENFERMERIA', name: 'Enfermería' }],
    _count: { refreshTokens: 2 },
    ...overrides,
  }
}

function renderWizard(user: UserDetail) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DeactivateWizard user={user} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

describe('DeactivateWizard', () => {
  it('bloquea la auto-desactivación con mensaje claro', () => {
    currentUserId = 'target-1' // el usuario en sesión es el mismo que el objetivo
    renderWizard(baseUser({ id: 'target-1' }))
    expect(screen.getByText(/No puedes desactivar tu propia cuenta/i)).toBeDefined()
  })

  it('bloquea desactivar al último administrador activo', () => {
    currentUserId = 'someone-else'
    renderWizard(baseUser({ id: 'target-1', roles: [{ code: 'ADMIN', name: 'Administrador' }] }))
    expect(screen.getByText(/último administrador activo/i)).toBeDefined()
  })

  it('muestra el resumen de impacto para un usuario normal', () => {
    currentUserId = 'someone-else'
    renderWizard(baseUser())
    expect(screen.getByText(/Paso 1 de 4/i)).toBeDefined()
    expect(screen.getByText(/Desactivar a Ana Pérez/i)).toBeDefined()
  })
})
