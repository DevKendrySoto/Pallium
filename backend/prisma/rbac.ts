// ============================================================================
//  CATÁLOGO RBAC  — fuente única de permisos y roles del sistema.
//  Lo consume el seed (prisma/seed.ts) y los tests (rbac.spec.ts).
// ============================================================================

// Permisos en formato "recurso:acción".
export const PERMISSIONS: Record<string, string> = {
  // Pacientes
  'patient:read': 'Ver pacientes y su historia',
  'patient:create': 'Registrar pacientes',
  'patient:update': 'Editar datos del paciente',
  'patient:delete': 'Eliminar (lógico) un paciente',
  'patient:change-status': 'Cambiar estado (Activo/Pasivo/Deceso)',

  // Visitas / agenda
  'visit:read': 'Ver visitas y agenda',
  'visit:create': 'Agendar visitas',
  'visit:update': 'Editar/reagendar visitas',
  'visit:cancel': 'Cancelar visitas',
  'visit:complete': 'Registrar visita como realizada',
  'visit:assign': 'Asignar profesionales a una visita',

  // Rutas
  'route:read': 'Ver rutas',
  'route:create': 'Crear rutas',
  'route:update': 'Editar rutas',
  'route:delete': 'Eliminar rutas',
  'route:dispatch': 'Despachar ruta al chofer (WhatsApp)',
  'route:assign-clinical-team': 'Asignar equipo clínico (médico/enfermera) a una ruta',
  'driver:read': 'Ver choferes',
  'driver:manage': 'Gestionar choferes',

  // Perfil clínico persistente
  'allergy:write': 'Registrar/editar alergias',
  'history:write': 'Registrar/editar antecedentes y hábitos',
  'directive:write': 'Registrar/firmar voluntades anticipadas',
  'social:write': 'Editar cuidadores, familia, genograma y perfil social',
  'immunization:write': 'Registrar/editar inmunizaciones',

  // Registro clínico
  'clinical:read': 'Ver registros clínicos',
  'note:medical:write': 'Escribir nota médica',
  'note:nursing:write': 'Escribir nota de enfermería',
  'note:psychology:write': 'Escribir nota de psicología',
  'note:social:write': 'Escribir nota de trabajo social',
  'note:physio:write': 'Escribir nota de fisiatría/terapia física',
  'vitals:write': 'Registrar signos vitales',
  'diagnosis:read': 'Ver diagnósticos',
  'diagnosis:write': 'Registrar/editar diagnósticos',
  'medication:read': 'Ver medicación',
  'medication:write': 'Prescribir/editar medicación',

  // Escalas
  'scale:read': 'Ver escalas y valoraciones',
  'scale:assess': 'Aplicar una escala a un paciente',
  'scale:manage': 'Gestionar el catálogo de escalas',

  // Transversal
  'alert:read': 'Ver alertas',
  'alert:manage': 'Reconocer/resolver alertas',
  'timeline:read': 'Ver el timeline del paciente',
  'document:read': 'Ver documentos',
  'document:upload': 'Subir documentos',
  'document:delete': 'Eliminar documentos',

  // Operaciones
  'cadence:run': 'Ejecutar manualmente el escaneo de cadencia',

  // Administración
  'user:read': 'Ver usuarios',
  'user:manage': 'Gestionar usuarios',
  'role:read': 'Ver roles',
  'role:manage': 'Gestionar roles y permisos',
  'category:manage': 'Gestionar categorías de paciente',
  'audit:read': 'Consultar la bitácora de auditoría',
}

export const ALL = Object.keys(PERMISSIONS)
export const READ_ONLY = ALL.filter((p) => p.endsWith(':read'))

// Permisos base del rol Médico. El Coordinador médico los hereda en su totalidad
// y suma los permisos exclusivos de coordinación.
export const MEDICO_PERMISSIONS: string[] = [
  'patient:read',
  'visit:read', 'visit:complete', 'visit:assign',
  'clinical:read', 'note:medical:write', 'vitals:write',
  'diagnosis:read', 'diagnosis:write',
  'medication:read', 'medication:write',
  'allergy:write', 'history:write', 'directive:write', 'immunization:write',
  'scale:read', 'scale:assess',
  'alert:read', 'alert:manage',
  'timeline:read', 'document:read', 'document:upload',
]

export interface RoleSeed {
  code: string
  name: string
  description: string
  isReadOnly?: boolean
  permissions: string[] | '*'
}

export const ROLES: RoleSeed[] = [
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Acceso total al sistema',
    permissions: '*',
  },
  {
    code: 'AUDITOR',
    name: 'Auditor',
    description: 'Solo lectura sobre todo el sistema',
    isReadOnly: true,
    permissions: [...READ_ONLY, 'audit:read'],
  },
  {
    code: 'AGENDA',
    name: 'Agenda y Citas',
    description: 'Gestiona agenda, visitas, rutas y despacho a choferes',
    permissions: [
      'patient:read',
      'visit:read', 'visit:create', 'visit:update', 'visit:cancel', 'visit:assign',
      'route:read', 'route:create', 'route:update', 'route:delete', 'route:dispatch',
      'driver:read', 'driver:manage',
      'cadence:run',
      'alert:read', 'timeline:read', 'document:read',
    ],
  },
  {
    code: 'MEDICO',
    name: 'Médico',
    description: 'Atención médica, diagnósticos y medicación',
    permissions: MEDICO_PERMISSIONS,
  },
  {
    code: 'COORDINADOR_MEDICO',
    name: 'Coordinador médico',
    description:
      'Médico con responsabilidades de coordinación clínica. Crea pacientes, gestiona estados clínicos críticos y asigna equipo clínico a las rutas.',
    permissions: [
      ...MEDICO_PERMISSIONS,
      'patient:create',
      'patient:change-status',
      'route:read',
      'route:assign-clinical-team',
    ],
  },
  {
    code: 'ENFERMERIA',
    name: 'Enfermería',
    description: 'Cuidados de enfermería, curaciones, signos vitales y escalas',
    permissions: [
      'patient:read',
      'visit:read', 'visit:complete',
      'clinical:read', 'note:nursing:write', 'vitals:write',
      'medication:read',
      'allergy:write', 'history:write', 'immunization:write',
      'scale:read', 'scale:assess',
      'alert:read', 'alert:manage',
      'timeline:read', 'document:read', 'document:upload',
    ],
  },
  {
    code: 'PSICOLOGIA',
    name: 'Psicología',
    description: 'Atención psicológica y escalas psicosociales',
    permissions: [
      'patient:read',
      'visit:read', 'visit:complete',
      'clinical:read', 'note:psychology:write',
      'scale:read', 'scale:assess',
      'alert:read', 'timeline:read', 'document:read',
    ],
  },
  {
    code: 'TRABAJO_SOCIAL',
    name: 'Trabajo Social',
    description: 'Valoración y gestión socioeconómica y familiar',
    permissions: [
      'patient:read',
      'visit:read', 'visit:complete',
      'clinical:read', 'note:social:write',
      'social:write',
      'alert:read', 'timeline:read', 'document:read', 'document:upload',
    ],
  },
  {
    code: 'FISIATRA',
    name: 'Fisiatra / Terapia Física',
    description: 'Valoración funcional y terapia física',
    permissions: [
      'patient:read',
      'visit:read', 'visit:complete',
      'clinical:read', 'note:physio:write',
      'scale:read', 'scale:assess',
      'alert:read', 'timeline:read', 'document:read',
    ],
  },
]
