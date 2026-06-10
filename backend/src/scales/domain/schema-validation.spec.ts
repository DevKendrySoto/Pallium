import { validateScaleSchema } from './schema-validation'

describe('validateScaleSchema', () => {
  it('acepta un single-select válido (estilo KARNOFSKY)', () => {
    const errors = validateScaleSchema(
      { type: 'single-select', options: [{ value: 100, label: 'Normal' }, { value: 0, label: 'Fallecido' }] },
      { max: 40, severity: 'HIGH', message: 'bajo' },
    )
    expect(errors).toEqual([])
  })

  it('acepta un sum válido (estilo BARTHEL)', () => {
    const errors = validateScaleSchema({
      type: 'sum',
      items: [{ key: 'feeding', label: 'Alimentación', options: [0, 5, 10] }],
    })
    expect(errors).toEqual([])
  })

  it('acepta multi-numeric válido (estilo ESAS)', () => {
    const errors = validateScaleSchema({
      type: 'multi-numeric',
      scale: { min: 0, max: 10 },
      items: ['dolor', 'cansancio'],
    })
    expect(errors).toEqual([])
  })

  it('rechaza un type desconocido', () => {
    const errors = validateScaleSchema({ type: 'pinwheel' })
    expect(errors.some((e) => e.includes('schema.type'))).toBe(true)
  })

  it('rechaza single-select sin options', () => {
    const errors = validateScaleSchema({ type: 'single-select' })
    expect(errors.some((e) => e.includes('options'))).toBe(true)
  })

  it('rechaza sum con options no numéricas', () => {
    const errors = validateScaleSchema({
      type: 'sum',
      items: [{ key: 'a', label: 'A', options: ['x'] }],
    })
    expect(errors.some((e) => e.includes('options'))).toBe(true)
  })

  it('rechaza alertRule con severidad inválida', () => {
    const errors = validateScaleSchema(
      { type: 'single-select', options: [{ value: 1, label: 'x' }] },
      { severity: 'URGENTE' },
    )
    expect(errors.some((e) => e.includes('severity'))).toBe(true)
  })

  it('rechaza un schema que no es objeto', () => {
    expect(validateScaleSchema('nope')).toEqual(['El schema debe ser un objeto.'])
  })
})
