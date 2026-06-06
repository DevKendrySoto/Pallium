import { Injectable } from '@nestjs/common'
import {
  AlertSeverity,
  AlertStatus,
  AlertType,
  PatientStatus,
  RouteStatus,
  type Specialty,
  VisitStatus,
} from '@prisma/client'
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

  // ===== Agenda (bandeja operativa, alcance clínica) =====

  /** Visitas agendadas (sin confirmar) del día. */
  async agendaScheduledVisits(day: Date, limit: number) {
    const start = startOfDay(day)
    const end = addDays(start, 1)
    const where = { status: VisitStatus.SCHEDULED, scheduledDate: { gte: start, lt: end } }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        take: limit,
        select: {
          id: true,
          scheduledDate: true,
          modality: true,
          type: true,
          status: true,
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.visit.count({ where }),
    ])
    return { items, total }
  }

  /** Rutas del día con chofer y número de paradas. */
  routesToday(day: Date) {
    const start = startOfDay(day)
    const end = addDays(start, 1)
    return this.prisma.route.findMany({
      where: { routeDate: { gte: start, lt: end } },
      orderBy: { routeDate: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        driverId: true,
        dispatchedAt: true,
        driver: { select: { fullName: true } },
        _count: { select: { stops: true } },
      },
    })
  }

  /** Pacientes activos con cadencia vencida (próxima visita regular ya pasó). */
  countOverdueCadence(day: Date): Promise<number> {
    return this.prisma.patient.count({
      where: {
        deletedAt: null,
        status: PatientStatus.ACTIVE,
        nextRegularVisitDue: { lt: startOfDay(day) },
      },
    })
  }

  /** Alertas administrativas abiertas (alcance clínica), más recientes primero. */
  async openAdministrativeAlerts(limit: number) {
    const where = { type: AlertType.ADMINISTRATIVE, status: AlertStatus.OPEN }
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

  // ===== Coordinador médico (supervisión, alcance clínica) =====

  /** Alertas críticas abiertas (alcance clínica). */
  countOpenCriticalAlerts(): Promise<number> {
    return this.prisma.alert.count({
      where: { status: AlertStatus.OPEN, severity: AlertSeverity.CRITICAL },
    })
  }

  /** Rutas de hoy a las que les falta médico y/o enfermera (no canceladas/completadas). */
  routesTodayMissingTeam(day: Date) {
    const start = startOfDay(day)
    const end = addDays(start, 1)
    return this.prisma.route.findMany({
      where: {
        routeDate: { gte: start, lt: end },
        status: { notIn: [RouteStatus.CANCELLED, RouteStatus.COMPLETED] },
        OR: [{ assignedMedicalId: null }, { assignedNursingId: null }],
      },
      orderBy: { routeDate: 'asc' },
      select: {
        id: true,
        name: true,
        assignedMedicalId: true,
        assignedNursingId: true,
        _count: { select: { stops: true } },
      },
    })
  }

  /** Pacientes activos candidatos a revisar estado (rehúsos acumulados ≥ 3). */
  async patientsToReview(limit: number) {
    const where = {
      deletedAt: null,
      status: PatientStatus.ACTIVE,
      refusalCount: { gte: 3 },
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy: { refusalCount: 'desc' },
        take: limit,
        select: { id: true, mrn: true, firstName: true, lastName: true, refusalCount: true },
      }),
      this.prisma.patient.count({ where }),
    ])
    return { items, total }
  }

  /** Admisiones (pacientes creados) en los últimos N días. */
  countRecentAdmissions(days: number): Promise<number> {
    const since = addDays(startOfDay(new Date()), -days)
    return this.prisma.patient.count({
      where: { deletedAt: null, createdAt: { gte: since } },
    })
  }

  /** Alertas severas abiertas (high/critical, alcance clínica), más recientes primero. */
  async openSevereAlerts(limit: number) {
    const where = {
      status: AlertStatus.OPEN,
      severity: { in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] },
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
