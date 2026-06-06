import { Injectable } from '@nestjs/common'
import { Specialty } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { DashboardRepository } from '../dashboard.repository'
import { MEDICO_QUICK_ACTIONS, type Widget } from '../dashboard.types'
import { buildClinicianWidgets } from './clinician-dashboard.builder'
import type { IDashboardStrategy } from './dashboard-strategy.interface'

/** Dashboard del médico: bandeja clínica del día (visitas, notas y escalas). */
@Injectable()
export class MedicoDashboardStrategy implements IDashboardStrategy {
  constructor(private readonly repo: DashboardRepository) {}

  build(user: AuthenticatedUser): Promise<Widget[]> {
    return buildClinicianWidgets(this.repo, user.id, {
      routeField: 'assignedMedicalId',
      specialty: Specialty.MEDICINE,
      pendingLabel: 'Pendientes de nota médica',
      quickActions: MEDICO_QUICK_ACTIONS,
    })
  }
}
