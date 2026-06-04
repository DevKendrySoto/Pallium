import type { AlertSeverity, AlertStatus, AlertType } from '@/types/alert'

export const TYPE_LABELS: Record<AlertType, string> = {
  CLINICAL: 'Clínica',
  SCALE_TRIGGERED: 'Escala',
  CADENCE: 'Cadencia',
  ADMINISTRATIVE: 'Administrativa',
  MEDICATION: 'Medicación',
}

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: 'Info',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const STATUS_LABELS: Record<AlertStatus, string> = {
  OPEN: 'Abierta',
  ACKNOWLEDGED: 'Reconocida',
  RESOLVED: 'Resuelta',
  DISMISSED: 'Descartada',
}

export const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  CRITICAL: 'border-transparent bg-danger text-danger-foreground',
  HIGH: 'border-transparent bg-danger/10 text-danger',
  MEDIUM: 'border-transparent bg-warning/15 text-amber-700',
  LOW: 'border-slate-200 bg-slate-100 text-slate-600',
  INFO: 'border-transparent bg-primary/10 text-primary',
}

export const STATUS_STYLES: Record<AlertStatus, string> = {
  OPEN: 'border-transparent bg-warning/15 text-amber-700',
  ACKNOWLEDGED: 'border-transparent bg-primary/10 text-primary',
  RESOLVED: 'border-transparent bg-success text-success-foreground',
  DISMISSED: 'border-slate-200 bg-slate-100 text-slate-600',
}
