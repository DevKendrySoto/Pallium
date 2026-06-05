// ============================================================================
//  Tipos del dashboard operacional por rol.
//  Estos contratos se replican en el frontend (validados con Zod).
// ============================================================================

export enum WidgetType {
  KPI_GROUP = 'kpi_group',
  TODAY_VISITS = 'today_visits',
  ALERTS_LIST = 'alerts_list',
  QUICK_ACTIONS = 'quick_actions',
  PLACEHOLDER = 'placeholder',
}

export type WidgetSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

// ---- kpi_group ----
export interface KpiItem {
  label: string
  value: number | string
  severity?: WidgetSeverity
}
export interface KpiGroupData {
  items: KpiItem[]
}

// ---- today_visits ----
export interface TodayVisitPatient {
  id: string
  fullName: string
  age: number | null
  addressShort: string | null
  primaryCaregiver: { name: string; phone: string | null } | null
}
export interface TodayVisitItem {
  id: string
  patient: TodayVisitPatient
  scheduledAt: string
  type: string
  status: string
  outcome: string | null
  routeOrder: number | null
  routeId: string | null
  requiresClinicalRecord: boolean
}
export interface TodayVisitsData {
  visits: TodayVisitItem[]
  total: number
  completed: number
}

// ---- alerts_list ----
export interface AlertListItem {
  id: string
  type: string
  severity: WidgetSeverity
  title: string
  patient: { id: string; name: string }
  triggeredAt: string
  requiresAction: boolean
}
export interface AlertsListData {
  alerts: AlertListItem[]
  total: number
}

// ---- quick_actions ----
export interface QuickAction {
  key: string
  label: string
}
export interface QuickActionsData {
  actions: QuickAction[]
}

// ---- placeholder ----
export interface PlaceholderData {
  message: string
}

export interface Widget<T = unknown> {
  type: WidgetType
  data: T
  meta?: Record<string, unknown>
}

export interface DashboardResponse {
  widgets: Widget[]
}

/** Catálogo de acciones rápidas para una visita seleccionada (enfermera). */
export const NURSE_QUICK_ACTIONS: QuickAction[] = [
  { key: 'start_visit', label: 'Iniciar visita' },
  { key: 'mark_patient_absent', label: 'Paciente fuera de casa' },
  { key: 'mark_out_of_time', label: 'Fuera de tiempo' },
  { key: 'mark_care_refused', label: 'Rehúso de atención' },
  { key: 'reschedule', label: 'Reprogramar' },
]

/** Catálogo de acciones rápidas para el médico (registra nota médica + escala). */
export const MEDICO_QUICK_ACTIONS: QuickAction[] = [
  { key: 'start_visit', label: 'Registrar visita médica' },
  { key: 'apply_scale', label: 'Aplicar escala' },
  { key: 'mark_patient_absent', label: 'Paciente fuera de casa' },
  { key: 'mark_out_of_time', label: 'Fuera de tiempo' },
  { key: 'mark_care_refused', label: 'Rehúso de atención' },
  { key: 'reschedule', label: 'Reprogramar' },
]
