import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import type { Widget } from '../dashboard.types'

/** Estrategia de construcción del dashboard para un rol concreto. */
export interface IDashboardStrategy {
  build(user: AuthenticatedUser): Promise<Widget[]>
}
