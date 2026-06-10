import { z } from 'zod'

export const calendarAppointmentSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  durationMinutes: z.number().nullable(),
  type: z.string(),
  status: z.string(),
  outcome: z.string().nullable(),
  patient: z.object({
    id: z.string(),
    fullName: z.string(),
    addressShort: z.string().nullable(),
    age: z.number().nullable(),
  }),
  assignedMedical: z.object({ id: z.string(), fullName: z.string() }).nullable(),
  assignedNursing: z.object({ id: z.string(), fullName: z.string() }).nullable(),
  routeId: z.string().nullable(),
  routeOrder: z.number().nullable(),
  zone: z.object({ id: z.string(), name: z.string() }).nullable(),
})
export type CalendarAppointment = z.infer<typeof calendarAppointmentSchema>

export const calendarDaySchema = z.object({
  date: z.string(),
  appointments: z.array(calendarAppointmentSchema),
  summary: z.object({
    total: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    pending: z.number(),
    noResponse: z.number(),
  }),
})
export type CalendarDay = z.infer<typeof calendarDaySchema>

export const calendarResponseSchema = z.object({
  days: z.array(calendarDaySchema),
  aggregates: z.object({
    totalWeek: z.number(),
    completionRate: z.number(),
    byTeam: z.record(z.object({ total: z.number(), completed: z.number() })),
    byZone: z.record(z.object({ total: z.number(), completed: z.number() })),
  }),
})
export type CalendarResponse = z.infer<typeof calendarResponseSchema>
