import { Injectable } from '@nestjs/common'
import { AlertSeverity } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { DashboardRepository } from '../dashboard.repository'
import {
  type EscalatedAlertsData,
  type FailedNotificationsData,
  type KpiGroupData,
  type PendingAdminClosuresData,
  type PendingUserRequestsData,
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

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/**
 * Dashboard operacional del administrador (alcance toda la clínica).
 * Orden: KPIs → cierres administrativos → solicitudes de usuario →
 * alertas escaladas → notificaciones fallidas.
 */
@Injectable()
export class AdminDashboardStrategy implements IDashboardStrategy {
  constructor(private readonly repo: DashboardRepository) {}

  async build(_user: AuthenticatedUser): Promise<Widget[]> {
    const now = new Date()
    const [activePatients, visitsToday, criticalAlerts, deathsThisMonth, closures, requests, escalated, failed] =
      await Promise.all([
        this.repo.countActivePatients(),
        this.repo.countVisitsToday(now),
        this.repo.countOpenCriticalAlerts(),
        this.repo.countDeathsThisMonth(now),
        this.repo.pendingAdminClosures(now, 20),
        this.repo.pendingUserRequests(20),
        this.repo.escalatedAlerts(now, 15),
        this.repo.failedNotifications(20),
      ])

    const kpiGroup: Widget<KpiGroupData> = {
      type: WidgetType.KPI_GROUP,
      data: {
        items: [
          { label: 'Pacientes activos', value: activePatients },
          { label: 'Visitas hoy', value: visitsToday },
          { label: 'Alertas críticas abiertas', value: criticalAlerts, severity: criticalAlerts > 0 ? 'critical' : undefined },
          { label: 'Defunciones este mes', value: deathsThisMonth },
        ],
      },
    }

    const pendingClosures: Widget<PendingAdminClosuresData> = {
      type: WidgetType.PENDING_ADMIN_CLOSURES,
      data: {
        items: closures.items.map((p) => ({
          patient: { id: p.id, fullName: `${p.firstName} ${p.lastName}` },
          deceasedAt: p.deceasedAt?.toISOString() ?? null,
          deceasedBy: p.statusHistory[0]?.changedBy?.fullName ?? null,
          daysPending: p.deceasedAt ? Math.floor((now.getTime() - p.deceasedAt.getTime()) / DAY_MS) : 0,
          hasClinicalClosure: p._count.clinicalRecords > 0,
        })),
        total: closures.total,
      },
    }

    const pendingRequests: Widget<PendingUserRequestsData> = {
      type: WidgetType.PENDING_USER_REQUESTS,
      data: {
        items: requests.items.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          email: r.email,
          roleCode: r.roleCode,
          reason: r.reason,
          requestedBy: r.requestedBy.fullName,
          createdAt: r.createdAt.toISOString(),
        })),
        total: requests.total,
      },
    }

    const escalatedAlerts: Widget<EscalatedAlertsData> = {
      type: WidgetType.ESCALATED_ALERTS,
      data: {
        items: escalated.items.map((a) => ({
          id: a.id,
          type: a.type,
          severity: SEVERITY_MAP[a.severity],
          title: a.title,
          patient: { id: a.patient.id, name: `${a.patient.firstName} ${a.patient.lastName}` },
          triggeredAt: a.createdAt.toISOString(),
          hoursOpen: Math.floor((now.getTime() - a.createdAt.getTime()) / HOUR_MS),
          assignedTo: a.acknowledgedBy?.fullName ?? null,
        })),
        total: escalated.total,
      },
    }

    const failedNotifications: Widget<FailedNotificationsData> = {
      type: WidgetType.FAILED_NOTIFICATIONS,
      data: {
        items: failed.items.map((d) => ({
          id: d.id,
          channel: d.channel,
          recipient: d.toPhone,
          lastError: d.error,
          failedAt: d.createdAt.toISOString(),
          routeId: d.routeId,
          routeName: d.route?.name ?? null,
        })),
        total: failed.total,
      },
    }

    return [kpiGroup, pendingClosures, pendingRequests, escalatedAlerts, failedNotifications]
  }
}
