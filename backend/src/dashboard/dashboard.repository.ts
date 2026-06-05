import { Injectable } from '@nestjs/common'
import { AlertSeverity, AlertStatus, AlertType, VisitStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

/** Severidades relevantes para la bandeja (medium o superior). */
const ACTIONABLE_SEVERITIES = [AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
/** Tipos de alerta considerados "clínicos". */
const CLINICAL_ALERT_TYPES = [AlertType.CLINICAL, AlertType.SCALE_TRIGGERED, AlertType.MEDICATION]
/** Estados de visita que implican atención en curso (paciente bajo cuidado). */
const ACTIVE_VISIT_STATUSES = [
  VisitStatus.SCHEDULED,
  VisitStatus.CONFIRMED,
  VisitStatus.EN_ROUTE,
  VisitStatus.IN_PROGRESS,
]

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

/**
 * Consultas de solo lectura para componer dashboards. No reimplementa lógica de
 * negocio (eso vive en los services); solo agrega datos para la vista.
 */
@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Una enfermera atiende una visita si está en su ruta o asignada directamente. */
  private nurseVisitWhere(nurseId: string) {
    return {
      OR: [
        { assignments: { some: { userId: nurseId } } },
        { routeStop: { route: { assignedNursingId: nurseId } } },
      ],
    }
  }

  /** Visitas de la enfermera para el día indicado, con datos del paciente y ruta. */
  nurseVisitsOnDate(nurseId: string, day: Date) {
    const start = startOfDay(day)
    const end = addDays(start, 1)
    return this.prisma.visit.findMany({
      where: {
        scheduledDate: { gte: start, lt: end },
        status: { not: VisitStatus.RESCHEDULED },
        ...this.nurseVisitWhere(nurseId),
      },
      select: {
        id: true,
        scheduledDate: true,
        type: true,
        status: true,
        outcome: true,
        routeStop: { select: { sequence: true, routeId: true } },
        _count: { select: { clinicalRecords: true } },
        address: { select: { line1: true, city: true } },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            addresses: {
              where: { isPrimary: true },
              take: 1,
              select: { line1: true, city: true },
            },
            caregivers: {
              where: { isPrimary: true },
              take: 1,
              select: { fullName: true, phone: true },
            },
          },
        },
      },
    })
  }

  /** IDs de pacientes bajo cuidado de la enfermera (visitas activas). */
  async assignedActivePatientIds(nurseId: string): Promise<string[]> {
    const visits = await this.prisma.visit.findMany({
      where: { status: { in: ACTIVE_VISIT_STATUSES }, ...this.nurseVisitWhere(nurseId) },
      select: { patientId: true },
    })
    return [...new Set(visits.map((v) => v.patientId))]
  }

  /** Cuenta alertas clínicas abiertas (medium+) de un conjunto de pacientes. */
  countOpenClinicalAlerts(patientIds: string[]): Promise<number> {
    if (patientIds.length === 0) return Promise.resolve(0)
    return this.prisma.alert.count({
      where: {
        patientId: { in: patientIds },
        status: AlertStatus.OPEN,
        type: { in: CLINICAL_ALERT_TYPES },
        severity: { in: ACTIONABLE_SEVERITIES },
      },
    })
  }

  /** Alertas abiertas (medium+) de un conjunto de pacientes, más recientes primero. */
  async openAlertsForPatients(patientIds: string[], limit: number) {
    if (patientIds.length === 0) return { items: [], total: 0 }
    const where = {
      patientId: { in: patientIds },
      status: AlertStatus.OPEN,
      severity: { in: ACTIONABLE_SEVERITIES },
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          severity: true,
          title: true,
          createdAt: true,
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.alert.count({ where }),
    ])
    return { items, total }
  }
}
