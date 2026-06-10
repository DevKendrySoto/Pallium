// ============================================================================
//  Tipos del dashboard operacional por rol.
//  Estos contratos se replican en el frontend (validados con Zod).
// ============================================================================

export enum WidgetType {
  KPI_GROUP = 'kpi_group',
  TODAY_VISITS = 'today_visits',
  ALERTS_LIST = 'alerts_list',
  QUICK_ACTIONS = 'quick_actions',
  VISITS_TO_CONFIRM = 'visits_to_confirm',
  ROUTES_TODAY = 'routes_today',
  PATIENTS_TO_REVIEW = 'patients_to_review',
  ROUTES_UNASSIGNED = 'routes_unassigned',
  PENDING_ADMIN_CLOSURES = 'pending_admin_closures',
  PENDING_USER_REQUESTS = 'pending_user_requests',
  ESCALATED_ALERTS = 'escalated_alerts',
  FAILED_NOTIFICATIONS = 'failed_notifications',
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

// ---- visits_to_confirm (agenda) ----
export interface VisitToConfirmItem {
  id: string
  patient: { id: string; name: string }
  scheduledAt: string
  modality: string
  type: string
  status: string
}
export interface VisitsToConfirmData {
  visits: VisitToConfirmItem[]
  total: number
}

// ---- routes_today (agenda) ----
export interface RouteTodayItem {
  id: string
  name: string | null
  status: string
  driverName: string | null
  stops: number
  canDispatch: boolean
  dispatchedAt: string | null
}
export interface RoutesTodayData {
  routes: RouteTodayItem[]
  total: number
}

// ---- patients_to_review (coordinador) ----
export interface PatientToReviewItem {
  id: string
  name: string
  mrn: string
  refusalCount: number
  reason: string
}
export interface PatientsToReviewData {
  patients: PatientToReviewItem[]
  total: number
}

// ---- routes_unassigned (coordinador) ----
export interface RouteUnassignedItem {
  id: string
  name: string | null
  stops: number
  missingMedical: boolean
  missingNursing: boolean
}
export interface RoutesUnassignedData {
  routes: RouteUnassignedItem[]
  total: number
}

// ---- pending_admin_closures (admin) ----
export interface PendingAdminClosureItem {
  patient: { id: string; fullName: string }
  deceasedAt: string | null
  deceasedBy: string | null
  daysPending: number
  hasClinicalClosure: boolean
}
export interface PendingAdminClosuresData {
  items: PendingAdminClosureItem[]
  total: number
}

// ---- pending_user_requests (admin) ----
export interface PendingUserRequestItem {
  id: string
  fullName: string
  email: string
  roleCode: string
  reason: string | null
  requestedBy: string
  createdAt: string
}
export interface PendingUserRequestsData {
  items: PendingUserRequestItem[]
  total: number
}

// ---- escalated_alerts (admin) ----
export interface EscalatedAlertItem {
  id: string
  type: string
  severity: WidgetSeverity
  title: string
  patient: { id: string; name: string }
  triggeredAt: string
  hoursOpen: number
  assignedTo: string | null
}
export interface EscalatedAlertsData {
  items: EscalatedAlertItem[]
  total: number
}

// ---- failed_notifications (admin) — sobre RouteDispatch fallidos ----
export interface FailedNotificationItem {
  id: string
  channel: string
  recipient: string
  lastError: string | null
  failedAt: string
  routeId: string
  routeName: string | null
}
export interface FailedNotificationsData {
  items: FailedNotificationItem[]
  total: number
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
