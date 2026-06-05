import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Widget } from '@/features/dashboard/types'
import { DashboardRenderer } from './widget-registry'

describe('DashboardRenderer', () => {
  it('renderiza los widgets en orden y usa fallback para tipos desconocidos', () => {
    const widgets: Widget[] = [
      { type: 'placeholder', data: { message: 'Primero' } },
      { type: 'placeholder', data: { message: 'Segundo' } },
      { type: 'tipo_desconocido', data: {} },
    ]
    const { container } = render(<DashboardRenderer widgets={widgets} />)
    const text = container.textContent ?? ''

    expect(text.indexOf('Primero')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('Primero')).toBeLessThan(text.indexOf('Segundo')) // orden preservado
    expect(text).toContain('Widget no soportado: tipo_desconocido') // fallback
  })
})
