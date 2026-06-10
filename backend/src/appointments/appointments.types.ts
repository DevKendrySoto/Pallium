// Contratos del cronograma semanal. Se replican en el frontend (Zod).

export interface CalendarAppointment {
  id: string
  scheduledAt: string
  durationMinutes: number | null
  type: string
  status: string
  outcome: string | null
  patient: { id: string; fullName: string; addressShort: string | null; age: number | null }
  assignedMedical: { id: string; fullName: string } | null
  assignedNursing: { id: string; fullName: string } | null
  routeId: string | null
  routeOrder: number | null
  zone: { id: string; name: string } | null
}

export interface CalendarDaySummary {
  total: number
  completed: number
  cancelled: number
  pending: number
  noResponse: number
}

export interface CalendarDay {
  date: string
  appointments: CalendarAppointment[]
  summary: CalendarDaySummary
}

export interface CalendarAggregates {
  totalWeek: number
  completionRate: number
  byTeam: Record<string, { total: number; completed: number }>
  byZone: Record<string, { total: number; completed: number }>
}

export interface CalendarResponse {
  days: CalendarDay[]
  aggregates: CalendarAggregates
}
