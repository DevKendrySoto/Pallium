import { computeScore, deriveInterpretation, evaluateAlertRule } from './scoring'

describe('scoring (motor de escalas)', () => {
  describe('computeScore', () => {
    it('single-select devuelve items.value', () => {
      expect(computeScore({ type: 'single-select' }, { value: 40 })).toBe(40)
    })
    it('sum suma los valores numéricos', () => {
      expect(computeScore({ type: 'sum' }, { a: 3, b: 3, c: 3, d: 2, e: 2 })).toBe(13)
    })
    it('multi-numeric suma los síntomas', () => {
      expect(computeScore({ type: 'multi-numeric' }, { dolor: 8, nausea: 2 })).toBe(10)
    })
    it('transform pedsql_linear promedia recodificado a 0–100', () => {
      // 0→100, 1→75, 2→50  => (100+75+50)/3 = 75
      expect(computeScore({ type: 'transform', transform: 'pedsql_linear' }, { q1: 0, q2: 1, q3: 2 })).toBe(75)
    })
    it('eq5d_index y classification no son computables (null)', () => {
      expect(computeScore({ type: 'transform', transform: 'eq5d_index' }, { vas: 50 })).toBeNull()
      expect(computeScore({ type: 'classification' }, { level: 'alta' })).toBeNull()
    })
  })

  describe('deriveInterpretation', () => {
    const bands = [
      { max: 6, label: 'Clase A' },
      { min: 7, max: 9, label: 'Clase B' },
      { min: 10, label: 'Clase C' },
    ]
    it('elige la banda por puntaje', () => {
      expect(deriveInterpretation({ type: 'sum', interpretationBands: bands }, 13, {})).toBe('Clase C')
      expect(deriveInterpretation({ type: 'sum', interpretationBands: bands }, 5, {})).toBe('Clase A')
    })
    it('clasificación devuelve el nivel', () => {
      expect(deriveInterpretation({ type: 'classification' }, null, { level: 'altamente complejo' })).toBe(
        'altamente complejo',
      )
    })
  })

  describe('evaluateAlertRule', () => {
    it('max: dispara si score <= max', () => {
      expect(evaluateAlertRule({ max: 40, severity: 'HIGH', message: 'bajo' }, 30, {})).toMatchObject({
        severity: 'HIGH',
      })
      expect(evaluateAlertRule({ max: 40 }, 90, {})).toBeNull()
    })
    it('min: dispara si score >= min', () => {
      expect(evaluateAlertRule({ min: 3 }, 4, {})).not.toBeNull()
      expect(evaluateAlertRule({ min: 3 }, 1, {})).toBeNull()
    })
    it('itemMin: dispara si algún ítem >= itemMin', () => {
      expect(evaluateAlertRule({ itemMin: 7 }, 14, { dolor: 8, nausea: 1 })).not.toBeNull()
      expect(evaluateAlertRule({ itemMin: 7 }, 5, { dolor: 3 })).toBeNull()
    })
    it('scoreMax y vasMax', () => {
      expect(evaluateAlertRule({ scoreMax: 70 }, 8.3, {})).not.toBeNull()
      expect(evaluateAlertRule({ vasMax: 40 }, null, { vas: 30 })).not.toBeNull()
      expect(evaluateAlertRule({ vasMax: 40 }, null, { vas: 80 })).toBeNull()
    })
    it('level: dispara por nivel de clasificación', () => {
      expect(
        evaluateAlertRule({ level: 'altamente complejo' }, null, { level: 'altamente complejo' }),
      ).not.toBeNull()
      expect(evaluateAlertRule({ level: 'altamente complejo' }, null, { level: 'no complejo' })).toBeNull()
    })
    it('sin regla no dispara', () => {
      expect(evaluateAlertRule(null, 0, {})).toBeNull()
    })
  })
})
