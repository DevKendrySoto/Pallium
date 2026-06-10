/** Etiqueta y color por código de rol. */
export const ROLE_META: Record<string, { label: string; bg: string }> = {
  ADMIN: { label: 'Administrador', bg: 'bg-slate-700' },
  COORDINADOR_MEDICO: { label: 'Coordinador médico', bg: 'bg-indigo-600' },
  MEDICO: { label: 'Médico', bg: 'bg-blue-600' },
  ENFERMERIA: { label: 'Enfermería', bg: 'bg-teal-600' },
  PSICOLOGIA: { label: 'Psicología', bg: 'bg-purple-600' },
  TRABAJO_SOCIAL: { label: 'Trabajo Social', bg: 'bg-amber-600' },
  FISIATRA: { label: 'Fisiatra', bg: 'bg-rose-600' },
  AGENDA: { label: 'Agenda', bg: 'bg-cyan-600' },
  AUDITOR: { label: 'Auditor', bg: 'bg-gray-500' },
}

export function roleMeta(code: string) {
  return ROLE_META[code] ?? { label: code, bg: 'bg-slate-500' }
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
