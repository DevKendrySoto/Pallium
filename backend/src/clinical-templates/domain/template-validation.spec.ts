import { validateTemplateSections } from './template-validation'

const validSection = {
  key: 'eval',
  title: 'Evaluación',
  components: [
    { type: 'VitalSignsBlock', key: 'vitals', config: {} },
    { type: 'ScaleApplication', key: 'scales', config: { scales: ['KARNOFSKY'] } },
  ],
}

describe('validateTemplateSections', () => {
  it('acepta una estructura válida', () => {
    expect(validateTemplateSections([validSection])).toEqual([])
  })

  it('exige al menos una sección', () => {
    expect(validateTemplateSections([])).toHaveLength(1)
    expect(validateTemplateSections('nope')).toHaveLength(1)
  })

  it('rechaza un tipo de componente desconocido', () => {
    const errors = validateTemplateSections([
      { key: 's', title: 'S', components: [{ type: 'MagicBox', key: 'm', config: {} }] },
    ])
    expect(errors.some((e) => e.includes('type debe ser uno de'))).toBe(true)
  })

  it('detecta claves de componente duplicadas en una sección', () => {
    const errors = validateTemplateSections([
      {
        key: 's',
        title: 'S',
        components: [
          { type: 'RecommendationsList', key: 'dup', config: {} },
          { type: 'RecommendationsList', key: 'dup', config: {} },
        ],
      },
    ])
    expect(errors.some((e) => e.includes('duplicado'))).toBe(true)
  })

  it('detecta claves de sección duplicadas', () => {
    const errors = validateTemplateSections([validSection, validSection])
    expect(errors.some((e) => e.includes('duplicada'))).toBe(true)
  })

  it('exige title y key de sección', () => {
    const errors = validateTemplateSections([{ components: [] }])
    expect(errors.some((e) => e.includes('.key es obligatorio'))).toBe(true)
    expect(errors.some((e) => e.includes('.title es obligatorio'))).toBe(true)
  })
})
