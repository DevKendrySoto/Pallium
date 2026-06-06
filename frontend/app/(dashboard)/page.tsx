'use client'

import { DashboardSelectionProvider } from '@/components/dashboard/dashboard-context'
import { LastUpdated } from '@/components/dashboard/last-updated'
import { DashboardRenderer } from '@/components/dashboard/widget-registry'
import { AlertsListSkeleton, AlertsListWidget } from '@/components/dashboard/widgets/alerts-list-widget'
import { KpiGroupSkeleton, KpiGroupWidget } from '@/components/dashboard/widgets/kpi-group-widget'
import { QuickActionsWidget } from '@/components/dashboard/widgets/quick-actions-widget'
import { TodayVisitsSkeleton, TodayVisitsWidget } from '@/components/dashboard/widgets/today-visits-widget'
import { useDashboard } from '@/features/dashboard/hooks'
import { WidgetType } from '@/features/dashboard/types'

export default function DashboardPage() {
  const { data, isLoading, isError, dataUpdatedAt, isFetching } = useDashboard()

  const widgetData = (type: string) => data?.widgets.find((w) => w.type === type)?.data
  const isNurse = Boolean(data?.widgets.some((w) => w.type === WidgetType.TODAY_VISITS))

  return (
    <DashboardSelectionProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Mi jornada</h1>
            <p className="text-sm text-muted-foreground">Tu bandeja de trabajo de hoy.</p>
          </div>
          {data && <LastUpdated updatedAt={dataUpdatedAt} fetching={isFetching} />}
        </div>

        {isLoading && (
          <div className="space-y-4">
            <KpiGroupSkeleton />
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <TodayVisitsSkeleton />
              </div>
              <div className="lg:col-span-2">
                <AlertsListSkeleton />
              </div>
            </div>
          </div>
        )}

        {isError && <p className="text-sm text-danger">No se pudo cargar el dashboard.</p>}

        {data && isNurse && (
          <>
            <KpiGroupWidget data={widgetData(WidgetType.KPI_GROUP)} />
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <TodayVisitsWidget data={widgetData(WidgetType.TODAY_VISITS)} />
              </div>
              <div className="lg:col-span-2">
                <AlertsListWidget data={widgetData(WidgetType.ALERTS_LIST)} />
              </div>
            </div>
            <QuickActionsWidget data={widgetData(WidgetType.QUICK_ACTIONS)} />
          </>
        )}

        {data && !isNurse && <DashboardRenderer widgets={data.widgets} />}
      </div>
    </DashboardSelectionProvider>
  )
}
