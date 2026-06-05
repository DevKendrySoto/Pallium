export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'radio'
  | 'chips'
  | 'date'
  | 'switch'

export interface TemplateField {
  key: string
  label: string
  type: FieldType
  options?: string[]
  unit?: string
  min?: number
  max?: number
}

export interface TemplateComponent {
  type: string
  key: string
  config: Record<string, unknown>
}

export interface TemplateSection {
  key: string
  title: string
  collapsible?: boolean
  components: TemplateComponent[]
}

export interface ClinicalTemplate {
  id: string
  key: string
  name: string
  specialty: string | null
  categoryCode: string | null
  version: number
  sections: TemplateSection[]
}

export type VisitOutcome = 'COMPLETED' | 'PATIENT_NOT_HOME' | 'OUT_OF_TIME' | 'REFUSED'

/** Valor del formulario dinámico: sección → componente → valor. */
export type ClinicalRecordSections = Record<string, Record<string, unknown>>

/** Contexto que reciben los componentes clínicos (paciente/visita). */
export interface ClinicalCtx {
  patientId: string
  visitId: string
}

/** Contrato común de un componente clínico del renderer dinámico. */
export interface CompProps {
  config: Record<string, unknown>
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  ctx?: ClinicalCtx
}

/** Definición de escala (subset usado por ScaleApplication). */
export interface ScaleDefinition {
  code: string
  name: string
  category: string
  schema: {
    type: 'single-select' | 'sum' | 'multi-numeric' | 'transform' | 'classification'
    options?: { label: string; value: number }[]
    items?: { key: string; label: string; options: (number | { label: string; value: number })[] }[]
    scale?: { min: number; max: number }
  }
}
