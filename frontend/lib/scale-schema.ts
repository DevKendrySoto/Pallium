/**
 * Validación y scoring de escalas en el cliente, espejo del dominio del backend
 * (`backend/src/scales/domain/`). Se usa para:
 *  - bloquear el guardado si el JSON del schema/alertRule es inválido, y
 *  - alimentar la vista previa en vivo (render + puntaje + alerta).
 * El backend revalida al guardar; esto es UX, no la barrera de seguridad.
 */

export const SCALE_TYPES = ['single-select', 'sum', 'multi-numeric', 'transform', 'classification'] as const
const TRANSFORMS = ['pedsql_linear', 'eq5d_index']
const SEVERITIES = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export type ScaleItems = Record<string, unknown>

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateScaleSchema(schema: unknown, alertRule?: unknown): string[] {
  const errors: string[] = []
  if (!isObject(schema)) return ['El schema debe ser un objeto.']
  const type = schema.type

  if (typeof type !== 'string' || !SCALE_TYPES.includes(type as (typeof SCALE_TYPES)[number])) {
    errors.push(`schema.type debe ser uno de: ${SCALE_TYPES.join(', ')}.`)
  }

  if (type === 'single-select') {
    if (!Array.isArray(schema.options) || schema.options.length === 0) {
      errors.push('single-select requiere "options" (lista no vacía).')
    } else {
      schema.options.forEach((o, i) => {
        if (!isObject(o) || typeof o.value !== 'number' || typeof o.label !== 'string') {
          errors.push(`options[${i}] debe tener { value: número, label: texto }.`)
        }
      })
    }
  } else if (type === 'sum') {
    if (!Array.isArray(schema.items) || schema.items.length === 0) {
      errors.push('sum requiere "items" (lista no vacía).')
    } else {
      schema.items.forEach((it, i) => {
        if (!isObject(it) || typeof it.key !== 'string' || typeof it.label !== 'string') {
          errors.push(`items[${i}] debe tener { key, label }.`)
        } else if (!Array.isArray(it.options) || !it.options.every((n) => typeof n === 'number')) {
          errors.push(`items[${i}].options debe ser una lista de números.`)
        }
      })
    }
  } else if (type === 'multi-numeric') {
    const scale = schema.scale
    if (!isObject(scale) || typeof scale.min !== 'number' || typeof scale.max !== 'number') {
      errors.push('multi-numeric requiere "scale" { min, max } numéricos.')
    }
    if (!Array.isArray(schema.items) || schema.items.length === 0) {
      errors.push('multi-numeric requiere "items" (lista no vacía).')
    }
  } else if (type === 'transform') {
    if (typeof schema.transform !== 'string' || !TRANSFORMS.includes(schema.transform)) {
      errors.push(`transform requiere "transform" en: ${TRANSFORMS.join(', ')}.`)
    }
  }

  if (schema.interpretationBands !== undefined && !Array.isArray(schema.interpretationBands)) {
    errors.push('interpretationBands debe ser una lista.')
  }

  if (alertRule !== undefined && alertRule !== null) {
    if (!isObject(alertRule)) {
      errors.push('alertRule debe ser un objeto o null.')
    } else if (
      alertRule.severity !== undefined &&
      (typeof alertRule.severity !== 'string' || !SEVERITIES.includes(alertRule.severity))
    ) {
      errors.push(`alertRule.severity debe ser una de: ${SEVERITIES.join(', ')}.`)
    }
  }

  return errors
}

// ===== Scoring portado (tipos interactivos) para la vista previa =====

function numericValues(items: ScaleItems): number[] {
  return Object.values(items).filter((v): v is number => typeof v === 'number')
}

export function previewScore(schema: Record<string, unknown>, items: ScaleItems): number | null {
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
      return null // transform/classification se calculan en el servidor
  }
}

interface Band { min?: number; max?: number; label: string }

export function previewInterpretation(schema: Record<string, unknown>, score: number | null): string | null {
  const bands = schema.interpretationBands as Band[] | undefined
  if (!bands || score === null) return null
  const band = bands.find((b) => (b.min === undefined || score >= b.min) && (b.max === undefined || score <= b.max))
  return band?.label ?? null
}

export function previewAlert(
  rule: Record<string, unknown> | null | undefined,
  score: number | null,
  items: ScaleItems,
): { severity: string; message: string } | null {
  if (!isObject(rule)) return null
  const severity = (typeof rule.severity === 'string' && rule.severity) || 'MEDIUM'
  const msg = (typeof rule.message === 'string' && rule.message) || 'Umbral de escala superado'
  const fire = { severity, message: msg }
  const nums = numericValues(items)

  if (typeof rule.itemMin === 'number' && nums.some((v) => v >= (rule.itemMin as number))) return fire
  if (typeof rule.max === 'number' && score !== null && score <= rule.max) return fire
  if (typeof rule.min === 'number' && score !== null && score >= rule.min) return fire
  if (typeof rule.scoreMax === 'number' && score !== null && score <= rule.scoreMax) return fire
  const vas = (items as { vas?: unknown }).vas
  if (typeof rule.vasMax === 'number' && typeof vas === 'number' && vas <= rule.vasMax) return fire
  const level = (items as { level?: unknown }).level
  if (typeof rule.level === 'string' && level === rule.level) return fire
  return null
}
