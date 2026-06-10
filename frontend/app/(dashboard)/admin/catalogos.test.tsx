import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PatientCategory } from '@/features/catalogs'
import CatalogsPage from './catalogos/page'

const categories: PatientCategory[] = [
  { id: 'c1', code: 'ONCO', name: 'Oncológico', description: 'Pacientes oncológicos', isActive: true, _count: { patients: 12 } },
  { id: 'c2', code: 'GERIAT', name: 'Geriátrico', description: null, isActive: false, _count: { patients: 0 } },
]

vi.mock('@/features/catalogs', async (orig) => ({
  ...(await orig<typeof import('@/features/catalogs')>()),
  useCategories: () => ({ data: categories, isLoading: false, isError: false }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
}))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CatalogsPage />
    </QueryClientProvider>,
  )
}

describe('CatalogsPage', () => {
  it('lista las categorías con su estado y uso', () => {
    renderPage()
    expect(screen.getByText('Oncológico')).toBeDefined()
    expect(screen.getByText('Geriátrico')).toBeDefined()
    expect(screen.getByText('Activa')).toBeDefined()
    expect(screen.getByText('Inactiva')).toBeDefined()
    expect(screen.getByText('12')).toBeDefined()
  })

  it('ofrece activar/desactivar según el estado', () => {
    renderPage()
    expect(screen.getByText('Desactivar')).toBeDefined() // la activa
    expect(screen.getByText('Activar')).toBeDefined() // la inactiva
  })
})
