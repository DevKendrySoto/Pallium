import { AlertSeverity } from '@prisma/client'

/**
 * Cálculo de puntaje, interpretación y umbrales de alerta para escalas.
 * Dominio puro: sin Prisma ni I/O. Trabaja sobre el `schema`/`alertRule`
 * (JSON sembrado en ScaleDefinition).
 */

export type ScaleItems = Record<string, unknown>

type ScaleType = 'single-select' | 'sum' | 'multi-numeric' | 'transform' | 'classification'

interface InterpretationBand {
  min?: number
  max?: number
  label: string
}

interface ScaleSchema {
  type?: ScaleType
  /** Para type 'transform': identificador del cálculo. */
  transform?: 'pedsql_linear' | 'eq5d_index'
  /** Bandas para derivar la interpretación a partir del puntaje. */
  interpretationBands?: InterpretationBand[]
  [k: string]: unknown
}

interface AlertRule {
  /** Dispara si score <= max (escalas donde "menos es peor"). */
  max?: number
  /** Dispara si score >= min (escalas donde "más es peor"). */
  min?: number
  /** Dispara si algún ítem individual >= itemMin (p. ej. ESAS). */
  itemMin?: number
  /** Dispara si el puntaje calculado por transform <= scoreMax (p. ej. PedsQL). */
  scoreMax?: number
  /** Dispara si la EVA (items.vas) <= vasMax (p. ej. EQ-5D). */
  vasMax?: number
  /** Dispara si la clasificación (items.level) coincide (p. ej. IDC-Pal). */
  level?: string
  severity?: keyof typeof AlertSeverity
  message?: string
}

function numericValues(items: ScaleItems): number[] {
  return Object.values(items).filter((v): v is number => typeof v === 'number')
}

/** PedsQL: ítems 0–4 → recodificados (0→100…4→0) y promediados a 0–100. */
function pedsqlLinear(items: ScaleItems): number | null {
  const vals = numericValues(items)
  if (!vals.length) return null
  const recoded = vals.map((v) => (4 - v) * 25)
  return Math.round((recoded.reduce((a, b) => a + b, 0) / recoded.length) * 10) / 10
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
    case 'transform': {
      if (schema.transform === 'pedsql_linear') return pedsqlLinear(items)
      // eq5d_index requiere value-set por país: sin él no hay índice (se guarda perfil + EVA).
      return null
    }
    case 'classification':
      return null
    default:
      return null
  }
}

/** Deriva la interpretación: banda por puntaje, o nivel para clasificaciones. */
export function deriveInterpretation(
  schema: ScaleSchema,
  score: number | null,
  items: ScaleItems,
): string | null {
  if (schema.type === 'classification') {
    const level = (items as { level?: unknown }).level
    return typeof level === 'string' ? level : null
  }
  if (schema.interpretationBands && score !== null) {
    const band = schema.interpretationBands.find(
      (b) => (b.min === undefined || score >= b.min) && (b.max === undefined || score <= b.max),
    )
    return band?.label ?? null
  }
  return null
}

export interface AlertEvaluation {
  severity: AlertSeverity
  message: string
}

/** Evalúa el alertRule contra puntaje/ítems/nivel. Devuelve null si no se dispara. */
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
  if (typeof rule.scoreMax === 'number' && score !== null && score <= rule.scoreMax) {
    return fire(rule.message)
  }
  const vas = (items as { vas?: unknown }).vas
  if (typeof rule.vasMax === 'number' && typeof vas === 'number' && vas <= rule.vasMax) {
    return fire(rule.message)
  }
  const level = (items as { level?: unknown }).level
  if (typeof rule.level === 'string' && level === rule.level) {
    return fire(rule.message)
  }
  return null
}
