export type TimelineEventType =
  | 'REGISTRATION'
  | 'STATUS_CHANGE'
  | 'VISIT_SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'CLINICAL_NOTE'
  | 'SCALE_ASSESSMENT'
  | 'ALERT_RAISED'
  | 'ALERT_RESOLVED'
  | 'DIAGNOSIS_ADDED'
  | 'MEDICATION_CHANGE'
  | 'DOCUMENT_UPLOADED'
  | 'ADMISSION_APPROVED'

export interface TimelineEvent {
  id: string
  patientId: string
  type: TimelineEventType
  title: string
  description: string | null
  occurredAt: string
  sourceType: string | null
  sourceId: string | null
  actor?: { id: string; fullName: string } | null
}
