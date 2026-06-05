import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { type PlaceholderData, type Widget, WidgetType } from '../dashboard.types'
import type { IDashboardStrategy } from './dashboard-strategy.interface'

/** Estrategia por defecto para roles sin dashboard propio todavía. */
@Injectable()
export class PlaceholderDashboardStrategy implements IDashboardStrategy {
  build(_user: AuthenticatedUser): Promise<Widget[]> {
    const widget: Widget<PlaceholderData> = {
      type: WidgetType.PLACEHOLDER,
      data: { message: 'Dashboard en construcción para este rol' },
    }
    return Promise.resolve([widget])
  }
}
