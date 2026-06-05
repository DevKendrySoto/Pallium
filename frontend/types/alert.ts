export type AlertType =
  | 'CLINICAL'
  | 'SCALE_TRIGGERED'
  | 'CADENCE'
  | 'ADMINISTRATIVE'
  | 'MEDICATION'

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'

export interface Alert {
  id: string
  patientId: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string | null
  sourceType: string | null
  sourceId: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  createdAt: string
  patient?: {
    id: string
    mrn: string
    firstName: string
    lastName: string
  }
}
