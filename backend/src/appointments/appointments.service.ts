import { Injectable } from '@nestjs/common'
import { type Prisma, Specialty, VisitStatus, type VisitType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type {
  CalendarAggregates,
  CalendarAppointment,
  CalendarDay,
  CalendarResponse,
} from './appointments.types'

export interface CalendarFilters {
  from?: string
  to?: string
  zoneId?: string
  userId?: string
  status?: VisitStatus
  type?: VisitType
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}
/** Lunes de la semana de `d` (00:00). */
function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay() // 0=domingo
  const diff = day === 0 ? -6 : 1 - day
  return addDays(x, diff)
}
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** Parsea una fecha; las fechas "YYYY-MM-DD" se interpretan como locales (no UTC). */
function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s)
}
function ageFrom(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--
  return age
}

const calendarInclude = {
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      addresses: { where: { isPrimary: true }, take: 1, select: { line1: true, city: true } },
    },
  },
  address: { select: { line1: true, city: true } },
  routeStop: {
    select: {
      sequence: true,
      routeId: true,
      route: {
        select: {
          assignedMedical: { select: { id: true, fullName: true } },
          assignedNursing: { select: { id: true, fullName: true } },
        },
      },
    },
  },
  assignments: { select: { specialty: true, user: { select: { id: true, fullName: true } } } },
} satisfies Prisma.VisitInclude

type CalendarVisit = Prisma.VisitGetPayload<{ include: typeof calendarInclude }>

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(filters: CalendarFilters): Promise<CalendarResponse> {
    const from = filters.from ? startOfDay(parseDate(filters.from)) : startOfWeekMonday(new Date())
    const to = filters.to ? startOfDay(parseDate(filters.to)) : addDays(from, 6)
    const queryEnd = addDays(to, 1)

    const where: Prisma.VisitWhereInput = {
      scheduledDate: { gte: from, lt: queryEnd },
      status: { not: VisitStatus.RESCHEDULED },
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.userId && {
        OR: [
          { assignments: { some: { userId: filters.userId } } },
          { routeStop: { route: { assignedMedicalId: filters.userId } } },
          { routeStop: { route: { assignedNursingId: filters.userId } } },
        ],
      }),
    }

    const visits = await this.prisma.visit.findMany({
      where,
      include: calendarInclude,
      orderBy: { scheduledDate: 'asc' },
    })

    const mapped = visits
      .map((v) => this.toAppointment(v))
      .filter((a) => !filters.zoneId || a.zone?.id === filters.zoneId)

    // Agrupar por día, generando todos los días del rango (aunque estén vacíos).
    const byDay = new Map<string, CalendarAppointment[]>()
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) byDay.set(dateKey(d), [])
    for (const a of mapped) {
      const key = dateKey(new Date(a.scheduledAt))
      if (byDay.has(key)) byDay.get(key)!.push(a)
    }

    const days: CalendarDay[] = [...byDay.entries()].map(([date, appointments]) => ({
      date,
      appointments,
      summary: summarize(appointments),
    }))

    return { days, aggregates: aggregate(mapped) }
  }

  private toAppointment(v: CalendarVisit): CalendarAppointment {
    const addr = v.address ?? v.patient.addresses[0] ?? null
    const medical =
      v.routeStop?.route?.assignedMedical ??
      v.assignments.find((a) => a.specialty === Specialty.MEDICINE)?.user ??
      null
    const nursing =
      v.routeStop?.route?.assignedNursing ??
      v.assignments.find((a) => a.specialty === Specialty.NURSING)?.user ??
      null
    return {
      id: v.id,
      scheduledAt: v.scheduledDate.toISOString(),
      durationMinutes: v.durationMin,
      type: v.type,
      status: v.status,
      outcome: v.outcome,
      patient: {
        id: v.patient.id,
        fullName: `${v.patient.firstName} ${v.patient.lastName}`,
        addressShort: addr ? `${addr.line1}, ${addr.city}` : null,
        age: ageFrom(v.patient.birthDate),
      },
      assignedMedical: medical ? { id: medical.id, fullName: medical.fullName } : null,
      assignedNursing: nursing ? { id: nursing.id, fullName: nursing.fullName } : null,
      routeId: v.routeStop?.routeId ?? null,
      routeOrder: v.routeStop?.sequence ?? null,
      zone: addr?.city ? { id: addr.city, name: addr.city } : null,
    }
  }
}

const PENDING = new Set<string>([
  VisitStatus.SCHEDULED,
  VisitStatus.CONFIRMED,
  VisitStatus.EN_ROUTE,
  VisitStatus.IN_PROGRESS,
])

function summarize(appts: CalendarAppointment[]) {
  return {
    total: appts.length,
    completed: appts.filter((a) => a.status === VisitStatus.COMPLETED).length,
    cancelled: appts.filter((a) => a.status === VisitStatus.CANCELLED).length,
    pending: appts.filter((a) => PENDING.has(a.status)).length,
    noResponse: appts.filter((a) => a.status === VisitStatus.NO_SHOW).length,
  }
}

function aggregate(appts: CalendarAppointment[]): CalendarAggregates {
  const total = appts.length
  const completed = appts.filter((a) => a.status === VisitStatus.COMPLETED).length
  const byTeam: Record<string, { total: number; completed: number }> = {}
  const byZone: Record<string, { total: number; completed: number }> = {}
  for (const a of appts) {
    const done = a.status === VisitStatus.COMPLETED
    if (a.assignedMedical) {
      const t = (byTeam[a.assignedMedical.id] ??= { total: 0, completed: 0 })
      t.total++
      if (done) t.completed++
    }
    if (a.zone) {
      const z = (byZone[a.zone.id] ??= { total: 0, completed: 0 })
      z.total++
      if (done) z.completed++
    }
  }
  return {
    totalWeek: total,
    completionRate: total ? Math.round((completed / total) * 100) / 100 : 0,
    byTeam,
    byZone,
  }
}
