import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AlertType, Prisma, TimelineEventType } from '@prisma/client'
import { AlertsService } from '../alerts/alerts.service'
import { PrismaService } from '../prisma/prisma.service'
import { validateScaleSchema } from './domain/schema-validation'
import {
  computeScore,
  deriveInterpretation,
  evaluateAlertRule,
  type ScaleItems,
} from './domain/scoring'
import type { AssessScaleDto, ListAssessmentsDto } from './dto/assess-scale.dto'
import type { CreateScaleDefinitionDto, UpdateScaleDefinitionDto } from './dto/scale-admin.dto'
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

  // ===== Administración del catálogo (scale:manage) =====

  listAllDefinitions() {
    return this.repo.listAllDefinitions()
  }

  async createDefinition(dto: CreateScaleDefinitionDto) {
    const code = dto.code.trim().toUpperCase()
    this.assertValidSchema(dto.schema, dto.alertRule)
    const existing = await this.repo.findDefinitionByCode(code)
    if (existing) throw new ConflictException('Ya existe una escala con ese código.')
    return this.repo.createDefinition({
      code,
      name: dto.name.trim(),
      category: dto.category,
      description: dto.description?.trim() || null,
      schema: dto.schema as Prisma.InputJsonValue,
      alertRule: (dto.alertRule ?? undefined) as Prisma.InputJsonValue | undefined,
    })
  }

  async updateDefinition(code: string, dto: UpdateScaleDefinitionDto) {
    await this.getDefinition(code)
    if (dto.schema !== undefined) this.assertValidSchema(dto.schema, dto.alertRule)
    return this.repo.updateDefinition(code, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.schema !== undefined && { schema: dto.schema as Prisma.InputJsonValue }),
      ...(dto.alertRule !== undefined && {
        alertRule: (dto.alertRule ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      }),
    })
  }

  private assertValidSchema(schema: unknown, alertRule?: unknown) {
    const errors = validateScaleSchema(schema, alertRule)
    if (errors.length) throw new BadRequestException(errors)
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
    const schema = def.schema as Record<string, unknown>
    const score = computeScore(schema, items)
    // La interpretación explícita gana; si no, se deriva de bandas/clasificación.
    const interpretation = dto.interpretation ?? deriveInterpretation(schema, score, items) ?? undefined

    const assessment = await this.repo.createAssessment({
      patient: { connect: { id: dto.patientId } },
      scale: { connect: { id: def.id } },
      ...(dto.visitId && { visit: { connect: { id: dto.visitId } } }),
      assessedBy: { connect: { id: assessedById } },
      items: dto.items as Prisma.InputJsonValue,
      score,
      interpretation,
    })

    await this.prisma.timelineEvent.create({
      data: {
        patientId: dto.patientId,
        type: TimelineEventType.SCALE_ASSESSMENT,
        title: `${def.code}${score !== null ? `: ${score}` : ''}`,
        description: interpretation,
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
