import { AlertSeverity } from '@prisma/client'

/**
 * Validación estructural del `schema`/`alertRule` de una ScaleDefinition.
 * Dominio puro (sin I/O): es la fuente de verdad reutilizada al crear/editar
 * desde el editor de administración. Captura los errores que romperían el
 * scoring o el render (tipo desconocido, opciones/ítems ausentes, severidad
 * inválida), sin ser tan estricto como para impedir variantes legítimas.
 */

const TYPES = ['single-select', 'sum', 'multi-numeric', 'transform', 'classification'] as const
const TRANSFORMS = ['pedsql_linear', 'eq5d_index'] as const
const SEVERITIES = Object.keys(AlertSeverity)

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateScaleSchema(schemaRaw: unknown, alertRuleRaw?: unknown): string[] {
  const errors: string[] = []

  if (!isObject(schemaRaw)) {
    return ['El schema debe ser un objeto.']
  }
  const schema = schemaRaw
  const type = schema.type

  if (typeof type !== 'string' || !TYPES.includes(type as (typeof TYPES)[number])) {
    errors.push(`schema.type debe ser uno de: ${TYPES.join(', ')}.`)
  }

  switch (type) {
    case 'single-select': {
      const options = schema.options
      if (!Array.isArray(options) || options.length === 0) {
        errors.push('single-select requiere "options" (lista no vacía).')
      } else {
        options.forEach((o, i) => {
          if (!isObject(o) || typeof o.value !== 'number' || typeof o.label !== 'string') {
            errors.push(`options[${i}] debe tener { value: número, label: texto }.`)
          }
        })
      }
      break
    }
    case 'sum': {
      const items = schema.items
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('sum requiere "items" (lista no vacía).')
      } else {
        items.forEach((it, i) => {
          if (!isObject(it) || typeof it.key !== 'string' || typeof it.label !== 'string') {
            errors.push(`items[${i}] debe tener { key, label }.`)
          } else if (!Array.isArray(it.options) || !it.options.every((n) => typeof n === 'number')) {
            errors.push(`items[${i}].options debe ser una lista de números.`)
          }
        })
      }
      break
    }
    case 'multi-numeric': {
      const scale = schema.scale
      if (!isObject(scale) || typeof scale.min !== 'number' || typeof scale.max !== 'number') {
        errors.push('multi-numeric requiere "scale" { min: número, max: número }.')
      }
      const items = schema.items
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('multi-numeric requiere "items" (lista no vacía de claves o { key, label }).')
      }
      break
    }
    case 'transform': {
      if (typeof schema.transform !== 'string' || !TRANSFORMS.includes(schema.transform as (typeof TRANSFORMS)[number])) {
        errors.push(`transform requiere "transform" en: ${TRANSFORMS.join(', ')}.`)
      }
      break
    }
    case 'classification':
      // Sin requisitos estructurales: el nivel se captura en items.level.
      break
  }

  if (schema.interpretationBands !== undefined) {
    if (!Array.isArray(schema.interpretationBands)) {
      errors.push('interpretationBands debe ser una lista.')
    } else {
      schema.interpretationBands.forEach((b, i) => {
        if (!isObject(b) || typeof b.label !== 'string') {
          errors.push(`interpretationBands[${i}] debe tener al menos { label }.`)
        }
      })
    }
  }

  if (alertRuleRaw !== undefined && alertRuleRaw !== null) {
    if (!isObject(alertRuleRaw)) {
      errors.push('alertRule debe ser un objeto o null.')
    } else if (
      alertRuleRaw.severity !== undefined &&
      (typeof alertRuleRaw.severity !== 'string' || !SEVERITIES.includes(alertRuleRaw.severity))
    ) {
      errors.push(`alertRule.severity debe ser una de: ${SEVERITIES.join(', ')}.`)
    }
  }

  return errors
}
