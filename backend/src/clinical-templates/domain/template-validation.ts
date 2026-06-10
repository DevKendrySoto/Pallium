/**
 * Validación estructural del `sections` de una ClinicalTemplate.
 * Dominio puro: fuente de verdad reutilizada al crear/editar desde el editor.
 * La lista de tipos de componente es el contrato con el renderer del frontend
 * (`frontend/components/visits/clinical/dynamic-form.tsx` → RENDERERS) y debe
 * mantenerse sincronizada con él.
 */

export const COMPONENT_TYPES = [
  'FieldsGroup',
  'VitalSignsBlock',
  'ScaleApplication',
  'RecommendationsList',
  'WoundTracker',
  'MedicationDelta',
  'PhotoAttachment',
  'SymptomChecklist',
  'ConsciousnessLevel',
  'FunctionalStatus',
  'CaregiverStatus',
  'AdherenceAssessment',
  'InterconsultRequest',
  'NextAppointmentScheduler',
] as const

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateTemplateSections(sectionsRaw: unknown): string[] {
  const errors: string[] = []

  if (!Array.isArray(sectionsRaw) || sectionsRaw.length === 0) {
    return ['sections debe ser una lista con al menos una sección.']
  }

  const sectionKeys = new Set<string>()
  sectionsRaw.forEach((section, si) => {
    if (!isObject(section)) {
      errors.push(`sections[${si}] debe ser un objeto.`)
      return
    }
    if (typeof section.key !== 'string' || !section.key.trim()) {
      errors.push(`sections[${si}].key es obligatorio.`)
    } else if (sectionKeys.has(section.key)) {
      errors.push(`La clave de sección "${section.key}" está duplicada.`)
    } else {
      sectionKeys.add(section.key)
    }
    if (typeof section.title !== 'string' || !section.title.trim()) {
      errors.push(`sections[${si}].title es obligatorio.`)
    }
    if (!Array.isArray(section.components)) {
      errors.push(`sections[${si}].components debe ser una lista.`)
      return
    }
    const compKeys = new Set<string>()
    section.components.forEach((comp, ci) => {
      const at = `sections[${si}].components[${ci}]`
      if (!isObject(comp)) {
        errors.push(`${at} debe ser un objeto.`)
        return
      }
      if (typeof comp.type !== 'string' || !COMPONENT_TYPES.includes(comp.type as (typeof COMPONENT_TYPES)[number])) {
        errors.push(`${at}.type debe ser uno de: ${COMPONENT_TYPES.join(', ')}.`)
      }
      if (typeof comp.key !== 'string' || !comp.key.trim()) {
        errors.push(`${at}.key es obligatorio.`)
      } else if (compKeys.has(comp.key)) {
        errors.push(`${at}.key "${comp.key}" está duplicado en la sección.`)
      } else {
        compKeys.add(comp.key)
      }
      if (comp.config !== undefined && !isObject(comp.config)) {
        errors.push(`${at}.config debe ser un objeto.`)
      }
    })
  })

  return errors
}
