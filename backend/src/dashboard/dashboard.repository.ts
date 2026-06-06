import { Injectable } from '@nestjs/common'
import { AlertSeverity, AlertStatus, AlertType, type Specialty, VisitStatus } from '@prisma/client'
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

/** Campo del modelo Route que vincula al clínico (enfermera o médico) con la ruta. */
export type RouteAssignmentField = 'assignedNursingId' | 'assignedMedicalId'

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
 * Consultas de solo lectura para componer dashboards de clínicos. No reimplementa
 * lógica de negocio (eso vive en los services); solo agrega datos para la vista.
 */
@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Un clínico atiende una visita si está asignado directamente o vía su ruta. */
  private clinicianVisitWhere(userId: string, routeField: RouteAssignmentField) {
    return {
      OR: [
        { assignments: { some: { userId } } },
        { routeStop: { route: { [routeField]: userId } } },
      ],
    }
  }

  /** Visitas del clínico para el día, con paciente, ruta y registros de su especialidad. */
  clinicianVisitsOnDate(
    userId: string,
    opts: { routeField: RouteAssignmentField; specialty: Specialty },
    day: Date,
  ) {
    const start = startOfDay(day)
    const end = addDays(start, 1)
    return this.prisma.visit.findMany({
      where: {
        scheduledDate: { gte: start, lt: end },
        status: { not: VisitStatus.RESCHEDULED },
        ...this.clinicianVisitWhere(userId, opts.routeField),
      },
      select: {
        id: true,
        scheduledDate: true,
        type: true,
        status: true,
        outcome: true,
        routeStop: { select: { sequence: true, routeId: true } },
        // Registros de la especialidad del clínico (para "pendiente de nota").
        clinicalRecords: {
          where: { specialty: opts.specialty, deletedAt: null },
          select: { id: true },
        },
        address: { select: { line1: true, city: true } },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            addresses: { where: { isPrimary: true }, take: 1, select: { line1: true, city: true } },
            caregivers: { where: { isPrimary: true }, take: 1, select: { fullName: true, phone: true } },
          },
        },
      },
    })
  }

  /** IDs de pacientes bajo cuidado del clínico (visitas activas). */
  async assignedActivePatientIds(userId: string, routeField: RouteAssignmentField): Promise<string[]> {
    const visits = await this.prisma.visit.findMany({
      where: { status: { in: ACTIVE_VISIT_STATUSES }, ...this.clinicianVisitWhere(userId, routeField) },
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
