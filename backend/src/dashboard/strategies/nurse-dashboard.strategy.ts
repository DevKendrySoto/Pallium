import { Injectable } from '@nestjs/common'
import { Specialty } from '@prisma/client'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { DashboardRepository } from '../dashboard.repository'
import { NURSE_QUICK_ACTIONS, type Widget } from '../dashboard.types'
import { buildClinicianWidgets } from './clinician-dashboard.builder'
import type { IDashboardStrategy } from './dashboard-strategy.interface'

/** Dashboard de la enfermera: bandeja de trabajo del día. */
@Injectable()
export class NurseDashboardStrategy implements IDashboardStrategy {
  constructor(private readonly repo: DashboardRepository) {}

  build(user: AuthenticatedUser): Promise<Widget[]> {
    return buildClinicianWidgets(this.repo, user.id, {
      routeField: 'assignedNursingId',
      specialty: Specialty.NURSING,
      pendingLabel: 'Pendientes',
      quickActions: NURSE_QUICK_ACTIONS,
    })
  }
}
