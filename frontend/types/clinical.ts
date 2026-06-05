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
