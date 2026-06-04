import { Injectable } from '@nestjs/common'
import {
  type AlertSeverity,
  type AlertType,
  AlertStatus,
  type Prisma,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AlertCreateInput) {
    return this.prisma.alert.create({ data })
  }

  findById(id: string) {
    return this.prisma.alert.findUnique({ where: { id } })
  }

  /** ¿Existe ya una alerta abierta de este tipo para el paciente? (dedup). */
  async hasOpenOfType(patientId: string, type: AlertType): Promise<boolean> {
    const count = await this.prisma.alert.count({
      where: {
        patientId,
        type,
        status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
      },
    })
    return count > 0
  }

  list(params: {
    patientId?: string
    status?: AlertStatus
    severity?: AlertSeverity
    type?: AlertType
  }) {
    return this.prisma.alert.findMany({
      where: {
        ...(params.patientId && { patientId: params.patientId }),
        ...(params.status && { status: params.status }),
        ...(params.severity && { severity: params.severity }),
        ...(params.type && { type: params.type }),
      },
      include: {
        patient: { select: { id: true, mrn: true, firstName: true, lastName: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })
  }

  update(id: string, data: Prisma.AlertUpdateInput) {
    return this.prisma.alert.update({ where: { id }, data })
  }
}
