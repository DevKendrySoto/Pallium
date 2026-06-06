import { AlertSeverity, type Specialty, VisitStatus } from '@prisma/client'
import type { DashboardRepository, RouteAssignmentField } from '../dashboard.repository'
import {
  type AlertsListData,
  type KpiGroupData,
  type QuickAction,
  type TodayVisitItem,
  type TodayVisitsData,
  type Widget,
  type WidgetSeverity,
  WidgetType,
} from '../dashboard.types'

const SEVERITY_MAP: Record<AlertSeverity, WidgetSeverity> = {
  [AlertSeverity.INFO]: 'info',
  [AlertSeverity.LOW]: 'low',
  [AlertSeverity.MEDIUM]: 'medium',
  [AlertSeverity.HIGH]: 'high',
  [AlertSeverity.CRITICAL]: 'critical',
}

function ageFrom(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--
  return age
}

function addressShort(
  visitAddr: { line1: string; city: string } | null,
  patientAddr: { line1: string; city: string }[] | undefined,
): string | null {
  const a = visitAddr ?? patientAddr?.[0] ?? null
  return a ? `${a.line1}, ${a.city}` : null
}

export interface ClinicianDashboardConfig {
  routeField: RouteAssignmentField
  specialty: Specialty
  /** Etiqueta del KPI de pendientes (p. ej. "Pendientes de nota médica"). */
  pendingLabel: string
  quickActions: QuickAction[]
}

/**
 * Construye los 4 widgets de la bandeja de un clínico (enfermera o médico).
 * Orden: KPIs → visitas de hoy → alertas → acciones rápidas.
 */
export async function buildClinicianWidgets(
  repo: DashboardRepository,
  userId: string,
  config: ClinicianDashboardConfig,
): Promise<Widget[]> {
  const today = new Date()
  const [visits, patientIds] = await Promise.all([
    repo.clinicianVisitsOnDate(userId, { routeField: config.routeField, specialty: config.specialty }, today),
    repo.assignedActivePatientIds(userId, config.routeField),
  ])
  const [clinicalAlertCount, alertsPage] = await Promise.all([
    repo.countOpenClinicalAlerts(patientIds),
    repo.openAlertsForPatients(patientIds, 10),
  ])

  const items: TodayVisitItem[] = visits
    .map((v) => ({
      id: v.id,
      patient: {
        id: v.patient.id,
        fullName: `${v.patient.firstName} ${v.patient.lastName}`,
        age: ageFrom(v.patient.birthDate),
        addressShort: addressShort(v.address, v.patient.addresses),
        primaryCaregiver: v.patient.caregivers[0]
          ? { name: v.patient.caregivers[0].fullName, phone: v.patient.caregivers[0].phone }
          : null,
      },
      scheduledAt: v.scheduledDate.toISOString(),
      type: v.type,
      status: v.status,
      outcome: v.outcome,
      routeOrder: v.routeStop?.sequence ?? null,
      routeId: v.routeStop?.routeId ?? null,
      requiresClinicalRecord: v.status !== VisitStatus.COMPLETED && v.clinicalRecords.length === 0,
    }))
    .sort((a, b) => {
      if (a.routeOrder != null && b.routeOrder != null) return a.routeOrder - b.routeOrder
      if (a.routeOrder != null) return -1
      if (b.routeOrder != null) return 1
      return a.scheduledAt.localeCompare(b.scheduledAt)
    })

  const completed = items.filter((v) => v.status === VisitStatus.COMPLETED).length
  const total = items.length
  const pending = items.filter((v) => v.requiresClinicalRecord).length

  const kpiGroup: Widget<KpiGroupData> = {
    type: WidgetType.KPI_GROUP,
    data: {
      items: [
        { label: 'Visitas asignadas hoy', value: total },
        { label: 'Visitas completadas hoy', value: completed },
        { label: config.pendingLabel, value: pending, severity: pending > 0 ? 'medium' : undefined },
        {
          label: 'Alertas clínicas abiertas',
          value: clinicalAlertCount,
          severity: clinicalAlertCount > 0 ? 'high' : undefined,
        },
      ],
    },
  }

  const todayVisits: Widget<TodayVisitsData> = {
    type: WidgetType.TODAY_VISITS,
    data: { visits: items, total, completed },
  }

  const alertsList: Widget<AlertsListData> = {
    type: WidgetType.ALERTS_LIST,
    data: {
      alerts: alertsPage.items.map((a) => ({
        id: a.id,
        type: a.type,
        severity: SEVERITY_MAP[a.severity],
        title: a.title,
        patient: { id: a.patient.id, name: `${a.patient.firstName} ${a.patient.lastName}` },
        triggeredAt: a.createdAt.toISOString(),
        requiresAction: a.severity === AlertSeverity.HIGH || a.severity === AlertSeverity.CRITICAL,
      })),
      total: alertsPage.total,
    },
  }

  const quickActions: Widget = {
    type: WidgetType.QUICK_ACTIONS,
    data: { actions: config.quickActions },
  }

  return [kpiGroup, todayVisits, alertsList, quickActions]
}
