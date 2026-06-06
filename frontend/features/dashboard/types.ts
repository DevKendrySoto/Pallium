import { z } from 'zod'

// Contratos del dashboard, espejo del backend (src/dashboard/dashboard.types.ts).

export const WidgetType = {
  KPI_GROUP: 'kpi_group',
  TODAY_VISITS: 'today_visits',
  ALERTS_LIST: 'alerts_list',
  QUICK_ACTIONS: 'quick_actions',
  VISITS_TO_CONFIRM: 'visits_to_confirm',
  ROUTES_TODAY: 'routes_today',
  PLACEHOLDER: 'placeholder',
} as const

export const widgetSeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical'])
export type WidgetSeverity = z.infer<typeof widgetSeveritySchema>

export const kpiItemSchema = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  severity: widgetSeveritySchema.optional(),
})
export const kpiGroupDataSchema = z.object({ items: z.array(kpiItemSchema) })
export type KpiGroupData = z.infer<typeof kpiGroupDataSchema>

export const todayVisitItemSchema = z.object({
  id: z.string(),
  patient: z.object({
    id: z.string(),
    fullName: z.string(),
    age: z.number().nullable(),
    addressShort: z.string().nullable(),
    primaryCaregiver: z.object({ name: z.string(), phone: z.string().nullable() }).nullable(),
  }),
  scheduledAt: z.string(),
  type: z.string(),
  status: z.string(),
  outcome: z.string().nullable(),
  routeOrder: z.number().nullable(),
  routeId: z.string().nullable(),
  requiresClinicalRecord: z.boolean(),
})
export type TodayVisitItem = z.infer<typeof todayVisitItemSchema>

export const todayVisitsDataSchema = z.object({
  visits: z.array(todayVisitItemSchema),
  total: z.number(),
  completed: z.number(),
})
export type TodayVisitsData = z.infer<typeof todayVisitsDataSchema>

export const alertItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: widgetSeveritySchema,
  title: z.string(),
  patient: z.object({ id: z.string(), name: z.string() }),
  triggeredAt: z.string(),
  requiresAction: z.boolean(),
})
export const alertsListDataSchema = z.object({
  alerts: z.array(alertItemSchema),
  total: z.number(),
})
export type AlertsListData = z.infer<typeof alertsListDataSchema>

export const quickActionSchema = z.object({ key: z.string(), label: z.string() })
export type QuickAction = z.infer<typeof quickActionSchema>
export const quickActionsDataSchema = z.object({ actions: z.array(quickActionSchema) })
export type QuickActionsData = z.infer<typeof quickActionsDataSchema>

export const visitToConfirmItemSchema = z.object({
  id: z.string(),
  patient: z.object({ id: z.string(), name: z.string() }),
  scheduledAt: z.string(),
  modality: z.string(),
  type: z.string(),
  status: z.string(),
})
export type VisitToConfirmItem = z.infer<typeof visitToConfirmItemSchema>
export const visitsToConfirmDataSchema = z.object({
  visits: z.array(visitToConfirmItemSchema),
  total: z.number(),
})
export type VisitsToConfirmData = z.infer<typeof visitsToConfirmDataSchema>

export const routeTodayItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  driverName: z.string().nullable(),
  stops: z.number(),
  canDispatch: z.boolean(),
  dispatchedAt: z.string().nullable(),
})
export type RouteTodayItem = z.infer<typeof routeTodayItemSchema>
export const routesTodayDataSchema = z.object({
  routes: z.array(routeTodayItemSchema),
  total: z.number(),
})
export type RoutesTodayData = z.infer<typeof routesTodayDataSchema>

export const placeholderDataSchema = z.object({ message: z.string() })
export type PlaceholderData = z.infer<typeof placeholderDataSchema>

export const widgetSchema = z.object({
  type: z.string(),
  data: z.unknown(),
  meta: z.record(z.unknown()).optional(),
})
export type Widget = z.infer<typeof widgetSchema>

export const dashboardResponseSchema = z.object({ widgets: z.array(widgetSchema) })
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>
