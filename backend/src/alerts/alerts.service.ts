import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  type AlertSeverity,
  type AlertType,
  AlertStatus,
  TimelineEventType,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AlertsRepository } from './alerts.repository'

export interface RaiseAlertInput {
  patientId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message?: string
  sourceType?: string
  sourceId?: string
  /** Si true, no crea otra alerta si ya hay una abierta del mismo tipo. */
  dedup?: boolean
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly repo: AlertsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Crea una alerta (con dedup opcional) y deja un evento en el timeline. */
  async raise(input: RaiseAlertInput) {
    if (input.dedup && (await this.repo.hasOpenOfType(input.patientId, input.type))) {
      return null // ya existe una abierta del mismo tipo
    }
    return this.prisma.$transaction(async (tx) => {
      const alert = await tx.alert.create({
        data: {
          patientId: input.patientId,
          type: input.type,
          severity: input.severity,
          title: input.title,
          message: input.message,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      })
      await tx.timelineEvent.create({
        data: {
          patientId: input.patientId,
          type: TimelineEventType.ALERT_RAISED,
          title: input.title,
          description: input.message,
          occurredAt: new Date(),
          sourceType: 'alert',
          sourceId: alert.id,
        },
      })
      return alert
    })
  }

  list(params: {
    patientId?: string
    status?: AlertStatus
    severity?: AlertSeverity
    type?: AlertType
  }) {
    return this.repo.list(params)
  }

  async acknowledge(id: string, userId: string) {
    const alert = await this.repo.findById(id)
    if (!alert) throw new NotFoundException('Alerta no encontrada')
    if (alert.status !== AlertStatus.OPEN) {
      throw new BadRequestException('Solo se pueden reconocer alertas abiertas')
    }
    return this.repo.update(id, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: { connect: { id: userId } },
      acknowledgedAt: new Date(),
    })
  }

  async resolve(id: string, userId: string) {
    const alert = await this.repo.findById(id)
    if (!alert) throw new NotFoundException('Alerta no encontrada')
    if (alert.status === AlertStatus.RESOLVED || alert.status === AlertStatus.DISMISSED) {
      throw new BadRequestException('La alerta ya está cerrada')
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedBy: { connect: { id: userId } },
          resolvedAt: new Date(),
        },
      })
      await tx.timelineEvent.create({
        data: {
          patientId: updated.patientId,
          type: TimelineEventType.ALERT_RESOLVED,
          title: `Alerta resuelta: ${updated.title}`,
          occurredAt: new Date(),
          actorId: userId,
          sourceType: 'alert',
          sourceId: updated.id,
        },
      })
      return updated
    })
  }
}
