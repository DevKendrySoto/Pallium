import { AlertSeverity } from '@prisma/client'

/**
 * Cálculo de puntaje y evaluación de umbrales de alerta para escalas.
 * Dominio puro: sin Prisma ni I/O. Trabaja sobre el `schema`/`alertRule`
 * que vienen en ScaleDefinition (JSON sembrado).
 */

export type ScaleItems = Record<string, unknown>

interface ScaleSchema {
  type?: 'single-select' | 'sum' | 'multi-numeric'
  [k: string]: unknown
}

interface AlertRule {
  /** Dispara si score <= max (escalas donde "menos es peor": KPS, PPS, Barthel). */
  max?: number
  /** Dispara si score >= min (escalas donde "más es peor": ECOG, PAINAD). */
  min?: number
  /** Dispara si algún ítem individual >= itemMin (p. ej. ESAS). */
  itemMin?: number
  severity?: keyof typeof AlertSeverity
  message?: string
}

function numericValues(items: ScaleItems): number[] {
  return Object.values(items).filter((v): v is number => typeof v === 'number')
}

/** Calcula el puntaje total según el tipo de escala. `null` si no es computable. */
export function computeScore(schema: ScaleSchema, items: ScaleItems): number | null {
  switch (schema.type) {
    case 'single-select': {
      const v = (items as { value?: unknown }).value
      return typeof v === 'number' ? v : null
    }
    case 'sum':
    case 'multi-numeric': {
      const vals = numericValues(items)
      return vals.length ? vals.reduce((a, b) => a + b, 0) : null
    }
    default:
      return null
  }
}

export interface AlertEvaluation {
  severity: AlertSeverity
  message: string
}

/** Evalúa el alertRule contra el puntaje/ítems. Devuelve null si no se dispara. */
export function evaluateAlertRule(
  rule: AlertRule | null | undefined,
  score: number | null,
  items: ScaleItems,
): AlertEvaluation | null {
  if (!rule) return null

  const severity = (rule.severity && AlertSeverity[rule.severity]) || AlertSeverity.MEDIUM
  const fire = (msg?: string): AlertEvaluation => ({
    severity,
    message: msg ?? 'Umbral de escala superado',
  })

  if (typeof rule.itemMin === 'number' && numericValues(items).some((v) => v >= rule.itemMin!)) {
    return fire(rule.message)
  }
  if (typeof rule.max === 'number' && score !== null && score <= rule.max) {
    return fire(rule.message)
  }
  if (typeof rule.min === 'number' && score !== null && score >= rule.min) {
    return fire(rule.message)
  }
  return null
}
