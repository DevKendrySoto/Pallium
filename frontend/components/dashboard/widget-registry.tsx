'use client'

import { WidgetType, type Widget } from '@/features/dashboard/types'
import { AlertsListWidget } from './widgets/alerts-list-widget'
import { KpiGroupWidget } from './widgets/kpi-group-widget'
import { EscalatedAlertsWidget } from './widgets/escalated-alerts-widget'
import { FailedNotificationsWidget } from './widgets/failed-notifications-widget'
import { PatientsToReviewWidget } from './widgets/patients-to-review-widget'
import { PendingAdminClosuresWidget } from './widgets/pending-admin-closures-widget'
import { PendingUserRequestsWidget } from './widgets/pending-user-requests-widget'
import { PlaceholderWidget } from './widgets/placeholder-widget'
import { QuickActionsWidget } from './widgets/quick-actions-widget'
import { RoutesTodayWidget } from './widgets/routes-today-widget'
import { RoutesUnassignedWidget } from './widgets/routes-unassigned-widget'
import { TodayVisitsWidget } from './widgets/today-visits-widget'
import { VisitsToConfirmWidget } from './widgets/visits-to-confirm-widget'

type WidgetComponent = (props: { data: unknown }) => React.ReactNode

/** Mapa type → componente. Tipos no registrados caen al fallback. */
export const widgetRegistry: Record<string, WidgetComponent> = {
  [WidgetType.KPI_GROUP]: KpiGroupWidget,
  [WidgetType.TODAY_VISITS]: TodayVisitsWidget,
  [WidgetType.ALERTS_LIST]: AlertsListWidget,
  [WidgetType.QUICK_ACTIONS]: QuickActionsWidget,
  [WidgetType.VISITS_TO_CONFIRM]: VisitsToConfirmWidget,
  [WidgetType.ROUTES_TODAY]: RoutesTodayWidget,
  [WidgetType.PATIENTS_TO_REVIEW]: PatientsToReviewWidget,
  [WidgetType.ROUTES_UNASSIGNED]: RoutesUnassignedWidget,
  [WidgetType.PENDING_ADMIN_CLOSURES]: PendingAdminClosuresWidget,
  [WidgetType.PENDING_USER_REQUESTS]: PendingUserRequestsWidget,
  [WidgetType.ESCALATED_ALERTS]: EscalatedAlertsWidget,
  [WidgetType.FAILED_NOTIFICATIONS]: FailedNotificationsWidget,
  [WidgetType.PLACEHOLDER]: PlaceholderWidget,
}

/** Renderiza los widgets en orden, con fallback si el type no está registrado. */
export function DashboardRenderer({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="space-y-4">
      {widgets.map((widget, i) => {
        const Component = widgetRegistry[widget.type]
        if (!Component) {
          return (
            <p key={`${widget.type}-${i}`} className="text-sm text-muted-foreground">
              Widget no soportado: {widget.type}
            </p>
          )
        }
        return <Component key={`${widget.type}-${i}`} data={widget.data} />
      })}
    </div>
  )
}
