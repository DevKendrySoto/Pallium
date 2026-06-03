import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { AlertSeverity, AlertType, PatientStatus } from '@prisma/client'
import type { Job } from 'bullmq'
import { AlertsService } from '../alerts/alerts.service'
import { PrismaService } from '../prisma/prisma.service'
import { CADENCE_WARNING_DAYS, addDays } from '../visits/domain/cadence'
import { CADENCE_QUEUE } from './cadence.constants'

export interface CadenceScanResult {
  scanned: number
  raised: number
  ranAt: string
}

/**
 * Worker de cadencia: busca pacientes ACTIVOS con visita regular vencida o
 * próxima a vencer y levanta alertas CADENCE (deduplicadas).
 */
@Processor(CADENCE_QUEUE)
export class CadenceProcessor extends WorkerHost {
  private readonly logger = new Logger(CadenceProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {
    super()
  }

  async process(_job: Job): Promise<CadenceScanResult> {
    return this.scan()
  }

  /** Ejecuta el escaneo. Reutilizado por el job repetible y el disparo manual. */
  async scan(): Promise<CadenceScanResult> {
    const now = new Date()
    const horizon = addDays(now, CADENCE_WARNING_DAYS)

    const patients = await this.prisma.patient.findMany({
      where: {
        status: PatientStatus.ACTIVE,
        deletedAt: null,
        nextRegularVisitDue: { not: null, lte: horizon },
      },
      select: { id: true, nextRegularVisitDue: true },
    })

    let raised = 0
    for (const p of patients) {
      const due = p.nextRegularVisitDue as Date
      const overdue = due < now
      const alert = await this.alerts.raise({
        patientId: p.id,
        type: AlertType.CADENCE,
        severity: overdue ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: overdue ? 'Visita regular vencida' : 'Visita regular próxima a vencer',
        message: `Visita regular prevista para ${due.toISOString().slice(0, 10)}`,
        sourceType: 'cadence',
        dedup: true,
      })
      if (alert) raised++
    }

    const result: CadenceScanResult = { scanned: patients.length, raised, ranAt: now.toISOString() }
    this.logger.log(`Escaneo de cadencia: ${result.scanned} pacientes, ${result.raised} alertas nuevas`)
    return result
  }
}
