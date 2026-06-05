export type RouteStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type DispatchStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface Driver {
  id: string
  fullName: string
  phone: string
  isActive: boolean
}

export interface RouteStop {
  id: string
  sequence: number
  plannedArrival: string | null
  arrivedAt: string | null
  completed: boolean
  visit: {
    id: string
    scheduledDate: string
    patient: { id: string; mrn: string; firstName: string; lastName: string }
    address: { line1: string; city: string; reference: string | null } | null
  }
}

export interface RouteDispatch {
  id: string
  channel: string
  toPhone: string
  message: string
  status: DispatchStatus
  providerMessageId: string | null
  error: string | null
  sentAt: string | null
  createdAt: string
}

export interface RouteListItem {
  id: string
  name: string | null
  routeDate: string
  status: RouteStatus
  driver: Driver | null
  _count: { stops: number }
}

export interface RouteDetail {
  id: string
  name: string | null
  routeDate: string
  status: RouteStatus
  notes: string | null
  driver: Driver | null
  dispatchedAt: string | null
  stops: RouteStop[]
  dispatches: RouteDispatch[]
}
