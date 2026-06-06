import { Injectable } from '@nestjs/common'
import { AlertSeverity, RouteStatus } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { DashboardRepository } from '../dashboard.repository'
import {
  type AlertsListData,
  type KpiGroupData,
  type RoutesTodayData,
  type VisitsToConfirmData,
  type Widget,
  type WidgetSeverity,
  WidgetType,
} from '../dashboard.types'
import type { IDashboardStrategy } from './dashboard-strategy.interface'

const SEVERITY_MAP: Record<AlertSeverity, WidgetSeverity> = {
  [AlertSeverity.INFO]: 'info',
  [AlertSeverity.LOW]: 'low',
  [AlertSeverity.MEDIUM]: 'medium',
  [AlertSeverity.HIGH]: 'high',
  [AlertSeverity.CRITICAL]: 'critical',
}

const DISPATCHABLE = new Set<string>([RouteStatus.PLANNED, RouteStatus.DISPATCHED])

/**
 * Dashboard de Agenda: bandeja operativa de la clínica.
 * Orden: KPIs → visitas por confirmar → rutas de hoy → alertas administrativas.
 */
@Injectable()
export class AgendaDashboardStrategy implements IDashboardStrategy {
  constructor(private readonly repo: DashboardRepository) {}

  async build(_user: AuthenticatedUser): Promise<Widget[]> {
    const today = new Date()
    const [scheduled, routes, overdueCadence, adminAlerts] = await Promise.all([
      this.repo.agendaScheduledVisits(today, 20),
      this.repo.routesToday(today),
      this.repo.countOverdueCadence(today),
      this.repo.openAdministrativeAlerts(10),
    ])

    const kpiGroup: Widget<KpiGroupData> = {
      type: WidgetType.KPI_GROUP,
      data: {
        items: [
          { label: 'Visitas por confirmar', value: scheduled.total, severity: scheduled.total > 0 ? 'medium' : undefined },
          { label: 'Rutas de hoy', value: routes.length },
          { label: 'Cadencia vencida', value: overdueCadence, severity: overdueCadence > 0 ? 'high' : undefined },
          { label: 'Alertas administrativas', value: adminAlerts.total, severity: adminAlerts.total > 0 ? 'medium' : undefined },
        ],
      },
    }

    const visitsToConfirm: Widget<VisitsToConfirmData> = {
      type: WidgetType.VISITS_TO_CONFIRM,
      data: {
        visits: scheduled.items.map((v) => ({
          id: v.id,
          patient: { id: v.patient.id, name: `${v.patient.firstName} ${v.patient.lastName}` },
          scheduledAt: v.scheduledDate.toISOString(),
          modality: v.modality,
          type: v.type,
          status: v.status,
        })),
        total: scheduled.total,
      },
    }

    const routesToday: Widget<RoutesTodayData> = {
      type: WidgetType.ROUTES_TODAY,
      data: {
        routes: routes.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          driverName: r.driver?.fullName ?? null,
          stops: r._count.stops,
          canDispatch: DISPATCHABLE.has(r.status) && r.driverId != null && r._count.stops > 0,
          dispatchedAt: r.dispatchedAt?.toISOString() ?? null,
        })),
        total: routes.length,
      },
    }

    const alertsList: Widget<AlertsListData> = {
      type: WidgetType.ALERTS_LIST,
      data: {
        alerts: adminAlerts.items.map((a) => ({
          id: a.id,
          type: a.type,
          severity: SEVERITY_MAP[a.severity],
          title: a.title,
          patient: { id: a.patient.id, name: `${a.patient.firstName} ${a.patient.lastName}` },
          triggeredAt: a.createdAt.toISOString(),
          requiresAction: a.severity === AlertSeverity.HIGH || a.severity === AlertSeverity.CRITICAL,
        })),
        total: adminAlerts.total,
      },
    }

    return [kpiGroup, visitsToConfirm, routesToday, alertsList]
  }
}
