import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})
let section = 'catalogos'
vi.mock('next/navigation', () => ({
  useParams: () => ({ section }),
  notFound: () => notFound(),
}))

import AdminPlaceholderPage from './[section]/page'

describe('AdminPlaceholderPage', () => {
  it('renderiza el título y la fase de una sección conocida', () => {
    section = 'catalogos'
    render(<AdminPlaceholderPage />)
    expect(screen.getByText('Catálogos')).toBeDefined()
    expect(screen.getByText(/fase 3 del roadmap/)).toBeDefined()
  })

  it('llama a notFound para una sección desconocida', () => {
    section = 'no-existe'
    expect(() => render(<AdminPlaceholderPage />)).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
