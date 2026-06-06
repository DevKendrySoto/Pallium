import { Injectable } from '@nestjs/common'
import { AlertSeverity } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { DashboardRepository } from '../dashboard.repository'
import {
  type AlertsListData,
  type KpiGroupData,
  type PatientsToReviewData,
  type RoutesUnassignedData,
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

/**
 * Dashboard del coordinador médico: bandeja de supervisión clínica.
 * Orden: KPIs → pacientes a revisar estado → rutas sin equipo → alertas severas.
 */
@Injectable()
export class CoordinatorDashboardStrategy implements IDashboardStrategy {
  constructor(private readonly repo: DashboardRepository) {}

  async build(_user: AuthenticatedUser): Promise<Widget[]> {
    const today = new Date()
    const [criticalAlerts, missingTeamRoutes, toReview, recentAdmissions, severeAlerts] =
      await Promise.all([
        this.repo.countOpenCriticalAlerts(),
        this.repo.routesTodayMissingTeam(today),
        this.repo.patientsToReview(20),
        this.repo.countRecentAdmissions(7),
        this.repo.openSevereAlerts(10),
      ])

    const kpiGroup: Widget<KpiGroupData> = {
      type: WidgetType.KPI_GROUP,
      data: {
        items: [
          { label: 'Alertas críticas', value: criticalAlerts, severity: criticalAlerts > 0 ? 'critical' : undefined },
          { label: 'Rutas sin equipo', value: missingTeamRoutes.length, severity: missingTeamRoutes.length > 0 ? 'medium' : undefined },
          { label: 'Pacientes a revisar', value: toReview.total, severity: toReview.total > 0 ? 'high' : undefined },
          { label: 'Admisiones (7 días)', value: recentAdmissions },
        ],
      },
    }

    const patientsToReview: Widget<PatientsToReviewData> = {
      type: WidgetType.PATIENTS_TO_REVIEW,
      data: {
        patients: toReview.items.map((p) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          mrn: p.mrn,
          refusalCount: p.refusalCount,
          reason: `${p.refusalCount} rehúsos de atención — evaluar estado pasivo`,
        })),
        total: toReview.total,
      },
    }

    const routesUnassigned: Widget<RoutesUnassignedData> = {
      type: WidgetType.ROUTES_UNASSIGNED,
      data: {
        routes: missingTeamRoutes.map((r) => ({
          id: r.id,
          name: r.name,
          stops: r._count.stops,
          missingMedical: r.assignedMedicalId == null,
          missingNursing: r.assignedNursingId == null,
        })),
        total: missingTeamRoutes.length,
      },
    }

    const alertsList: Widget<AlertsListData> = {
      type: WidgetType.ALERTS_LIST,
      data: {
        alerts: severeAlerts.items.map((a) => ({
          id: a.id,
          type: a.type,
          severity: SEVERITY_MAP[a.severity],
          title: a.title,
          patient: { id: a.patient.id, name: `${a.patient.firstName} ${a.patient.lastName}` },
          triggeredAt: a.createdAt.toISOString(),
          requiresAction: true,
        })),
        total: severeAlerts.total,
      },
    }

    return [kpiGroup, patientsToReview, routesUnassigned, alertsList]
  }
}
