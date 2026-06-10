import { describe, expect, it } from 'vitest'
import { previewAlert, previewInterpretation, previewScore, validateScaleSchema } from './scale-schema'

describe('validateScaleSchema (cliente)', () => {
  it('acepta single-select y sum válidos', () => {
    expect(validateScaleSchema({ type: 'single-select', options: [{ value: 1, label: 'x' }] })).toEqual([])
    expect(validateScaleSchema({ type: 'sum', items: [{ key: 'a', label: 'A', options: [0, 5] }] })).toEqual([])
  })

  it('rechaza tipo desconocido y options faltantes', () => {
    expect(validateScaleSchema({ type: 'foo' }).length).toBeGreaterThan(0)
    expect(validateScaleSchema({ type: 'single-select' }).some((e) => e.includes('options'))).toBe(true)
  })

  it('rechaza severidad de alerta inválida', () => {
    const errs = validateScaleSchema({ type: 'single-select', options: [{ value: 1, label: 'x' }] }, { severity: 'NOPE' })
    expect(errs.some((e) => e.includes('severity'))).toBe(true)
  })
})

describe('scoring de vista previa', () => {
  it('single-select usa items.value', () => {
    expect(previewScore({ type: 'single-select' }, { value: 70 })).toBe(70)
  })
  it('sum/multi-numeric suman los valores numéricos', () => {
    expect(previewScore({ type: 'sum' }, { a: 5, b: 10 })).toBe(15)
    expect(previewScore({ type: 'multi-numeric' }, { dolor: 7, nausea: 2 })).toBe(9)
  })
  it('transform/classification devuelven null (se calculan en servidor)', () => {
    expect(previewScore({ type: 'transform' }, { a: 1 })).toBeNull()
  })
  it('interpreta por bandas', () => {
    const schema = { type: 'sum', interpretationBands: [{ min: 0, max: 20, label: 'Dependencia total' }] }
    expect(previewInterpretation(schema, 15)).toBe('Dependencia total')
    expect(previewInterpretation(schema, 50)).toBeNull()
  })
  it('dispara alerta por umbral max y por itemMin', () => {
    expect(previewAlert({ max: 40, severity: 'HIGH', message: 'bajo' }, 30, {})).toMatchObject({ severity: 'HIGH', message: 'bajo' })
    expect(previewAlert({ itemMin: 7 }, null, { dolor: 8 })).not.toBeNull()
    expect(previewAlert({ max: 40 }, 90, {})).toBeNull()
  })
})
