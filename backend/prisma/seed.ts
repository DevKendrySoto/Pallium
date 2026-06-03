import 'dotenv/config'
import { PrismaClient, ScaleCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as argon2 from 'argon2'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ============================================================================
//  PERMISOS  (formato "recurso:acción")
// ============================================================================

const PERMISSIONS: Record<string, string> = {
  // Pacientes
  'patient:read': 'Ver pacientes y su historia',
  'patient:create': 'Registrar pacientes',
  'patient:update': 'Editar datos del paciente',
  'patient:delete': 'Eliminar (lógico) un paciente',
  'patient:approve': 'Aprobar admisión (Pendiente → Activo)',
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
  'driver:read': 'Ver choferes',
  'driver:manage': 'Gestionar choferes',

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

const ALL = Object.keys(PERMISSIONS)
const READ_ONLY = ALL.filter((p) => p.endsWith(':read'))

// ============================================================================
//  ROLES  (code, nombre, flags y permisos)
// ============================================================================

interface RoleSeed {
  code: string
  name: string
  description: string
  isReadOnly?: boolean
  permissions: string[] | '*'
}

const ROLES: RoleSeed[] = [
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
    description: 'Atención médica, diagnósticos, medicación y aprobación de admisión',
    permissions: [
      'patient:read', 'patient:approve', 'patient:change-status',
      'visit:read', 'visit:complete', 'visit:assign',
      'clinical:read', 'note:medical:write', 'vitals:write',
      'diagnosis:read', 'diagnosis:write',
      'medication:read', 'medication:write',
      'scale:read', 'scale:assess',
      'alert:read', 'alert:manage',
      'timeline:read', 'document:read', 'document:upload',
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

// ============================================================================
//  CATEGORÍAS DE PACIENTE
// ============================================================================

const CATEGORIES = [
  { code: 'PALLIATIVE_CHILD', name: 'Paliativo Infantil' },
  { code: 'PALLIATIVE_ADULT', name: 'Paliativo Adulto' },
  { code: 'CHRONIC', name: 'Crónico' },
  { code: 'ONCOLOGIC', name: 'Oncológico' },
]

// ============================================================================
//  ESCALAS FUNCIONALES Y PRONÓSTICAS
// ============================================================================

const SCALES = [
  {
    code: 'KARNOFSKY',
    name: 'Índice de Karnofsky (KPS)',
    category: ScaleCategory.FUNCTIONAL,
    description: 'Estado funcional global, 0–100.',
    schema: {
      type: 'single-select',
      min: 0,
      max: 100,
      step: 10,
      options: [
        { value: 100, label: 'Normal, sin quejas ni evidencia de enfermedad' },
        { value: 70, label: 'Se cuida; incapaz de actividad normal o trabajo' },
        { value: 50, label: 'Requiere asistencia considerable y cuidados frecuentes' },
        { value: 30, label: 'Severamente incapacitado; hospitalización indicada' },
        { value: 10, label: 'Moribundo' },
        { value: 0, label: 'Fallecido' },
      ],
    },
    alertRule: { max: 40, severity: 'HIGH', message: 'KPS bajo (≤40): deterioro funcional severo' },
  },
  {
    code: 'ECOG',
    name: 'ECOG Performance Status',
    category: ScaleCategory.PROGNOSTIC,
    description: 'Estado funcional 0 (normal) a 5 (fallecido).',
    schema: {
      type: 'single-select',
      min: 0,
      max: 5,
      options: [
        { value: 0, label: 'Totalmente activo' },
        { value: 1, label: 'Restringido en actividad extenuante' },
        { value: 2, label: 'Ambulatorio, incapaz de trabajar, en pie >50% del día' },
        { value: 3, label: 'Capacidad limitada de autocuidado, en cama >50% del día' },
        { value: 4, label: 'Completamente incapacitado, confinado a cama' },
        { value: 5, label: 'Fallecido' },
      ],
    },
    alertRule: { min: 3, severity: 'HIGH', message: 'ECOG ≥3: deterioro funcional severo' },
  },
  {
    code: 'PPS',
    name: 'Palliative Performance Scale',
    category: ScaleCategory.FUNCTIONAL,
    description: 'Rendimiento paliativo 0–100% en pasos de 10.',
    schema: { type: 'single-select', min: 0, max: 100, step: 10 },
    alertRule: { max: 30, severity: 'HIGH', message: 'PPS ≤30%: fase final probable' },
  },
  {
    code: 'BARTHEL',
    name: 'Índice de Barthel',
    category: ScaleCategory.FUNCTIONAL,
    description: 'Independencia en actividades básicas de la vida diaria, 0–100.',
    schema: {
      type: 'sum',
      items: [
        { key: 'feeding', label: 'Alimentación', options: [0, 5, 10] },
        { key: 'bathing', label: 'Baño', options: [0, 5] },
        { key: 'grooming', label: 'Aseo personal', options: [0, 5] },
        { key: 'dressing', label: 'Vestido', options: [0, 5, 10] },
        { key: 'bowels', label: 'Deposiciones', options: [0, 5, 10] },
        { key: 'bladder', label: 'Micción', options: [0, 5, 10] },
        { key: 'toilet', label: 'Uso del retrete', options: [0, 5, 10] },
        { key: 'transfers', label: 'Traslado sillón/cama', options: [0, 5, 10, 15] },
        { key: 'mobility', label: 'Deambulación', options: [0, 5, 10, 15] },
        { key: 'stairs', label: 'Escaleras', options: [0, 5, 10] },
      ],
    },
    alertRule: { max: 20, severity: 'MEDIUM', message: 'Barthel ≤20: dependencia total' },
  },
  {
    code: 'ESAS',
    name: 'Edmonton Symptom Assessment System',
    category: ScaleCategory.SYMPTOM,
    description: 'Intensidad 0–10 de 9 síntomas (dolor, cansancio, náusea, etc.).',
    schema: {
      type: 'multi-numeric',
      scale: { min: 0, max: 10 },
      items: [
        'dolor', 'cansancio', 'nausea', 'depresion', 'ansiedad',
        'somnolencia', 'apetito', 'malestar', 'disnea',
      ],
    },
    alertRule: { itemMin: 7, severity: 'HIGH', message: 'Síntoma ESAS ≥7: requiere intervención' },
  },
  {
    code: 'PAINAD',
    name: 'PAINAD (dolor en demencia avanzada)',
    category: ScaleCategory.PAIN,
    description: 'Evaluación conductual del dolor, 0–10.',
    schema: {
      type: 'sum',
      items: [
        { key: 'breathing', label: 'Respiración', options: [0, 1, 2] },
        { key: 'vocalization', label: 'Vocalización negativa', options: [0, 1, 2] },
        { key: 'facial', label: 'Expresión facial', options: [0, 1, 2] },
        { key: 'bodyLanguage', label: 'Lenguaje corporal', options: [0, 1, 2] },
        { key: 'consolability', label: 'Consolabilidad', options: [0, 1, 2] },
      ],
    },
    alertRule: { min: 7, severity: 'HIGH', message: 'PAINAD ≥7: dolor severo' },
  },
]

// ============================================================================
//  EJECUCIÓN
// ============================================================================

async function main() {
  console.log('🌱 Sembrando catálogos...')

  // Permisos
  for (const [code, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    })
  }
  console.log(`  ✔ ${ALL.length} permisos`)

  // Roles + asignación de permisos
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isReadOnly: !!r.isReadOnly },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: true,
        isReadOnly: !!r.isReadOnly,
      },
    })

    const codes = r.permissions === '*' ? ALL : r.permissions
    // Reemplaza el conjunto de permisos del rol de forma idempotente.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    const perms = await prisma.permission.findMany({ where: { code: { in: codes } } })
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    })
  }
  console.log(`  ✔ ${ROLES.length} roles`)

  // Categorías de paciente
  for (const c of CATEGORIES) {
    await prisma.patientCategory.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c,
    })
  }
  console.log(`  ✔ ${CATEGORIES.length} categorías de paciente`)

  // Escalas
  for (const s of SCALES) {
    await prisma.scaleDefinition.upsert({
      where: { code: s.code },
      update: { name: s.name, category: s.category, description: s.description, schema: s.schema, alertRule: s.alertRule },
      create: s,
    })
  }
  console.log(`  ✔ ${SCALES.length} escalas`)

  // Usuario administrador inicial (solo si no existe).
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } })
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@pallium.local'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin12345'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Administrador',
        passwordHash: await argon2.hash(adminPassword),
        isActive: true,
      },
    })
    await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } })
    console.log(`  ✔ admin creado: ${adminEmail} / ${adminPassword}`)
  } else {
    console.log(`  • admin ya existe: ${adminEmail}`)
  }

  console.log('✅ Seed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
