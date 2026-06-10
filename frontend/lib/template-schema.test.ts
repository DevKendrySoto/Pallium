import { describe, expect, it } from 'vitest'
import { validateTemplateSections } from './template-schema'

const valid = [
  { key: 'eval', title: 'Evaluación', components: [{ type: 'VitalSignsBlock', key: 'v', config: {} }] },
]

describe('validateTemplateSections (cliente)', () => {
  it('acepta una estructura válida', () => {
    expect(validateTemplateSections(valid)).toEqual([])
  })

  it('exige al menos una sección', () => {
    expect(validateTemplateSections([])).toHaveLength(1)
  })

  it('rechaza un tipo de componente desconocido', () => {
    const errs = validateTemplateSections([{ key: 's', title: 'S', components: [{ type: 'X', key: 'k', config: {} }] }])
    expect(errs.some((e) => e.includes('type'))).toBe(true)
  })

  it('detecta claves de componente duplicadas', () => {
    const errs = validateTemplateSections([
      { key: 's', title: 'S', components: [{ type: 'RecommendationsList', key: 'd', config: {} }, { type: 'RecommendationsList', key: 'd', config: {} }] },
    ])
    expect(errs.some((e) => e.includes('duplicado'))).toBe(true)
  })

  it('exige key y title de sección', () => {
    const errs = validateTemplateSections([{ components: [] }])
    expect(errs.some((e) => e.includes('.key'))).toBe(true)
    expect(errs.some((e) => e.includes('.title'))).toBe(true)
  })
})
