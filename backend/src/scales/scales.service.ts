import { Injectable, NotFoundException } from '@nestjs/common'
import { AlertType, type Prisma, TimelineEventType } from '@prisma/client'
import { AlertsService } from '../alerts/alerts.service'
import { PrismaService } from '../prisma/prisma.service'
import { computeScore, evaluateAlertRule, type ScaleItems } from './domain/scoring'
import type { AssessScaleDto, ListAssessmentsDto } from './dto/assess-scale.dto'
import { ScalesRepository } from './scales.repository'

@Injectable()
export class ScalesService {
  constructor(
    private readonly repo: ScalesRepository,
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {}

  listDefinitions() {
    return this.repo.listDefinitions()
  }

  async getDefinition(code: string) {
    const def = await this.repo.findDefinitionByCode(code)
    if (!def) throw new NotFoundException(`Escala ${code} no encontrada`)
    return def
  }

  /**
   * Aplica una escala: calcula el puntaje, guarda la valoración, deja evento en
   * el timeline y, si el alertRule se cumple, levanta una alerta SCALE_TRIGGERED.
   */
  async assess(dto: AssessScaleDto, assessedById: string) {
    const def = await this.getDefinition(dto.scaleCode)

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
      select: { id: true },
    })
    if (!patient) throw new NotFoundException('Paciente no encontrado')

    const items = dto.items as ScaleItems
    const score = computeScore(def.schema as Record<string, unknown>, items)

    const assessment = await this.repo.createAssessment({
      patient: { connect: { id: dto.patientId } },
      scale: { connect: { id: def.id } },
      ...(dto.visitId && { visit: { connect: { id: dto.visitId } } }),
      assessedBy: { connect: { id: assessedById } },
      items: dto.items as Prisma.InputJsonValue,
      score,
      interpretation: dto.interpretation,
    })

    await this.prisma.timelineEvent.create({
      data: {
        patientId: dto.patientId,
        type: TimelineEventType.SCALE_ASSESSMENT,
        title: `${def.code}${score !== null ? `: ${score}` : ''}`,
        description: dto.interpretation,
        occurredAt: new Date(),
        actorId: assessedById,
        sourceType: 'scale_assessment',
        sourceId: assessment.id,
      },
    })

    const evaluation = evaluateAlertRule(
      def.alertRule as Record<string, unknown> | null,
      score,
      items,
    )
    let alert = null
    if (evaluation) {
      alert = await this.alerts.raise({
        patientId: dto.patientId,
        type: AlertType.SCALE_TRIGGERED,
        severity: evaluation.severity,
        title: `Escala ${def.name}`,
        message: `${evaluation.message}${score !== null ? ` (puntaje ${score})` : ''}`,
        sourceType: 'scale_assessment',
        sourceId: assessment.id,
      })
    }

    return { assessment, alert }
  }

  async listAssessments(dto: ListAssessmentsDto) {
    let scaleId: string | undefined
    if (dto.scaleCode) {
      const def = await this.repo.findDefinitionByCode(dto.scaleCode)
      scaleId = def?.id ?? '__none__'
    }
    return this.repo.listAssessments({ patientId: dto.patientId, scaleId })
  }
}
