import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { CompProps } from '@/types/clinical'
import {
  AdherenceAssessment,
  ConsciousnessLevel,
  InterconsultRequest,
} from './additional-components'

// ScaleApplication (usado por FunctionalStatus) depende de hooks de red; no se prueba aquí.
function Harness({ Comp, config }: { Comp: React.ComponentType<CompProps>; config: Record<string, unknown> }) {
  const [value, setValue] = useState<Record<string, unknown>>({})
  return (
    <>
      <Comp config={config} value={value} onChange={setValue} />
      <pre data-testid="val">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('Componentes de plantilla adicionales', () => {
  it('ConsciousnessLevel registra el nivel AVDI seleccionado', async () => {
    const user = userEvent.setup()
    render(<Harness Comp={ConsciousnessLevel} config={{ scale: 'AVDI' }} />)
    await user.click(screen.getByRole('button', { name: 'Responde al dolor' }))
    expect(JSON.parse(screen.getByTestId('val').textContent!)).toEqual({ level: 'D' })
  })

  it('InterconsultRequest alterna roles y pide motivo al seleccionar', async () => {
    const user = userEvent.setup()
    render(<Harness Comp={InterconsultRequest} config={{ targetRoles: ['NURSING', 'PSYCHOLOGY'] }} />)
    expect(screen.queryByText('Motivo de la interconsulta')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Enfermería' }))
    expect(JSON.parse(screen.getByTestId('val').textContent!).roles).toEqual(['NURSING'])
    expect(screen.getByText('Motivo de la interconsulta')).toBeDefined()
  })

  it('AdherenceAssessment registra una calificación por dimensión', async () => {
    const user = userEvent.setup()
    render(<Harness Comp={AdherenceAssessment} config={{ dimensions: ['medication', 'diet'] }} />)
    await user.click(screen.getAllByRole('button', { name: 'Buena' })[0])
    expect(JSON.parse(screen.getByTestId('val').textContent!)).toEqual({ medication: 'good' })
  })
})
