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

  // ===== Catálogo ampliado (paliativos / domiciliario) =====

  // -- Cuidador / psicosocial --
  {
    code: 'ZARIT',
    name: 'Escala de sobrecarga del cuidador (Zarit)',
    category: ScaleCategory.CAREGIVER,
    description: '22 ítems Likert 0–4. Total 0–88.',
    schema: {
      type: 'sum',
      items: '22 ítems Likert 0–4 (nunca…casi siempre)',
      interpretationBands: [
        { max: 46, label: 'Sin sobrecarga' },
        { min: 47, max: 55, label: 'Sobrecarga leve' },
        { min: 56, label: 'Sobrecarga intensa' },
      ],
    },
    alertRule: { min: 56, severity: 'HIGH', message: 'Sobrecarga intensa del cuidador: riesgo de claudicación' },
  },
  {
    code: 'POS',
    name: 'Palliative care Outcome Scale (POS)',
    category: ScaleCategory.QUALITY_OF_LIFE,
    description: '10 ítems 0–4 (mayor = peor).',
    schema: {
      type: 'sum',
      items: '10 ítems 0–4',
      interpretationBands: [
        { max: 10, label: 'Bajo impacto' },
        { min: 11, max: 20, label: 'Impacto moderado' },
        { min: 21, label: 'Alto impacto' },
      ],
    },
    alertRule: { itemMin: 4, severity: 'MEDIUM', message: 'Ítem POS en máximo: problema no controlado' },
  },

  // -- Cognitivo --
  {
    code: 'PFEIFFER',
    name: 'Cuestionario de Pfeiffer (SPMSQ)',
    category: ScaleCategory.COGNITIVE,
    description: '10 preguntas; se cuenta el nº de ERRORES (0–10).',
    schema: {
      type: 'sum',
      items: '10 ítems error=1 / correcto=0',
      interpretationBands: [
        { max: 2, label: 'Normal' },
        { min: 3, max: 4, label: 'Deterioro leve' },
        { min: 5, max: 7, label: 'Deterioro moderado' },
        { min: 8, label: 'Deterioro severo' },
      ],
    },
    alertRule: { min: 5, severity: 'MEDIUM', message: 'Deterioro cognitivo moderado-severo (Pfeiffer)' },
  },

  // -- Funcional --
  {
    code: 'LAWTON_BRODY',
    name: 'Lawton-Brody (actividades instrumentales)',
    category: ScaleCategory.FUNCTIONAL,
    description: '8 actividades, 0–1 c/u. Total 0–8.',
    schema: {
      type: 'sum',
      items: '8 ítems 0/1',
      interpretationBands: [
        { min: 8, label: 'Independiente' },
        { min: 4, max: 7, label: 'Dependencia moderada' },
        { max: 3, label: 'Dependencia severa' },
      ],
    },
    alertRule: { max: 3, severity: 'LOW', message: 'Dependencia severa en AIVD' },
  },
  {
    code: 'LANSKY',
    name: 'Lansky Play-Performance (pediátrico)',
    category: ScaleCategory.FUNCTIONAL,
    description: 'Rendimiento 0–100 en pasos de 10.',
    schema: {
      type: 'single-select',
      min: 0,
      max: 100,
      step: 10,
      interpretationBands: [
        { min: 70, label: 'Funcional' },
        { min: 40, max: 69, label: 'Limitado' },
        { max: 39, label: 'Encamado/grave' },
      ],
    },
    alertRule: { max: 40, severity: 'HIGH', message: 'Lansky ≤40: deterioro funcional severo (pediátrico)' },
  },

  // -- Nutricional --
  {
    code: 'MNA_SCREEN',
    name: 'MNA-SF (cribado nutricional)',
    category: ScaleCategory.NUTRITIONAL,
    description: '6 ítems, total 0–14.',
    schema: {
      type: 'sum',
      items: '6 ítems ponderados',
      interpretationBands: [
        { min: 12, label: 'Estado normal' },
        { min: 8, max: 11, label: 'Riesgo de malnutrición' },
        { max: 7, label: 'Malnutrición' },
      ],
    },
    alertRule: { max: 7, severity: 'HIGH', message: 'Malnutrición (MNA cribado)' },
  },
  {
    code: 'MNA_FULL',
    name: 'MNA completo',
    category: ScaleCategory.NUTRITIONAL,
    description: 'Cribado + evaluación. Total 0–30.',
    schema: {
      type: 'sum',
      items: '18 ítems',
      interpretationBands: [
        { min: 24, label: 'Estado normal' },
        { min: 17, max: 23.5, label: 'Riesgo de malnutrición' },
        { max: 16.5, label: 'Malnutrición' },
      ],
    },
    alertRule: { max: 16.5, severity: 'HIGH', message: 'Malnutrición (MNA completo)' },
  },

  // -- Pronósticas (calculadas) --
  {
    code: 'PPI',
    name: 'Palliative Prognostic Index',
    category: ScaleCategory.PROGNOSTIC,
    description: 'Suma ponderada de PPS, ingesta, edema, disnea de reposo y delirium.',
    schema: {
      type: 'sum',
      items: [
        { key: 'pps', label: 'PPS', options: [{ label: '10–20', value: 4 }, { label: '30–50', value: 2.5 }, { label: '≥60', value: 0 }] },
        { key: 'intake', label: 'Ingesta oral', options: [{ label: 'Muy reducida', value: 2.5 }, { label: 'Moderadamente reducida', value: 1 }, { label: 'Normal', value: 0 }] },
        { key: 'edema', label: 'Edema', options: [{ label: 'Presente', value: 1 }, { label: 'Ausente', value: 0 }] },
        { key: 'dyspnea_rest', label: 'Disnea en reposo', options: [{ label: 'Sí', value: 3.5 }, { label: 'No', value: 0 }] },
        { key: 'delirium', label: 'Delirium', options: [{ label: 'Sí', value: 4 }, { label: 'No', value: 0 }] },
      ],
      interpretationBands: [
        { max: 4, label: 'Supervivencia >6 semanas (probable)' },
        { min: 4.1, max: 6, label: 'Incierto' },
        { min: 6.1, label: 'Supervivencia <3 semanas (probable)' },
      ],
    },
    alertRule: { min: 6.1, severity: 'HIGH', message: 'PPI >6: pronóstico de corta supervivencia' },
  },
  {
    code: 'CHILD_PUGH',
    name: 'Child-Pugh (función hepática)',
    category: ScaleCategory.PROGNOSTIC,
    description: '5 parámetros 1–3. Total 5–15 → clase A/B/C.',
    schema: {
      type: 'sum',
      items: [
        { key: 'bilirubin', label: 'Bilirrubina', options: [{ label: '<2', value: 1 }, { label: '2–3', value: 2 }, { label: '>3', value: 3 }] },
        { key: 'albumin', label: 'Albúmina', options: [{ label: '>3.5', value: 1 }, { label: '2.8–3.5', value: 2 }, { label: '<2.8', value: 3 }] },
        { key: 'inr', label: 'INR', options: [{ label: '<1.7', value: 1 }, { label: '1.7–2.3', value: 2 }, { label: '>2.3', value: 3 }] },
        { key: 'ascites', label: 'Ascitis', options: [{ label: 'Ausente', value: 1 }, { label: 'Leve', value: 2 }, { label: 'Moderada', value: 3 }] },
        { key: 'encephalopathy', label: 'Encefalopatía', options: [{ label: 'Ninguna', value: 1 }, { label: 'Grado 1–2', value: 2 }, { label: 'Grado 3–4', value: 3 }] },
      ],
      interpretationBands: [
        { max: 6, label: 'Clase A' },
        { min: 7, max: 9, label: 'Clase B' },
        { min: 10, label: 'Clase C' },
      ],
    },
    alertRule: { min: 10, severity: 'HIGH', message: 'Child-Pugh C: disfunción hepática grave' },
  },

  // -- Síntomas --
  {
    code: 'ESAS_R',
    name: 'ESAS-r (revisada)',
    category: ScaleCategory.SYMPTOM,
    description: 'Síntomas 0–10 con definiciones revisadas.',
    schema: {
      type: 'multi-numeric',
      scale: { min: 0, max: 10 },
      items: ['dolor', 'cansancio', 'somnolencia', 'nausea', 'apetito', 'disnea', 'depresion', 'ansiedad', 'bienestar'],
    },
    alertRule: { itemMin: 7, severity: 'HIGH', message: 'Síntoma ESAS-r ≥7: requiere intervención' },
  },

  // -- Dolor / conductuales --
  {
    code: 'WONG_BAKER',
    name: 'Wong-Baker FACES (dolor)',
    category: ScaleCategory.PAIN,
    description: 'Escala de caras, 0–10.',
    schema: {
      type: 'single-select',
      options: [
        { label: 'Sin dolor', value: 0 },
        { label: 'Duele un poco', value: 2 },
        { label: 'Duele un poco más', value: 4 },
        { label: 'Duele mucho', value: 6 },
        { label: 'Duele muchísimo', value: 8 },
        { label: 'El peor dolor', value: 10 },
      ],
    },
    alertRule: { min: 7, severity: 'HIGH', message: 'Dolor severo (Wong-Baker ≥7)' },
  },
  {
    code: 'FLACC',
    name: 'FLACC (dolor no verbal / pediátrico)',
    category: ScaleCategory.PAIN,
    description: '5 ítems 0–2. Total 0–10.',
    schema: {
      type: 'sum',
      items: [
        { key: 'face', label: 'Cara', options: [0, 1, 2] },
        { key: 'legs', label: 'Piernas', options: [0, 1, 2] },
        { key: 'activity', label: 'Actividad', options: [0, 1, 2] },
        { key: 'cry', label: 'Llanto', options: [0, 1, 2] },
        { key: 'consolability', label: 'Consolabilidad', options: [0, 1, 2] },
      ],
      interpretationBands: [
        { max: 3, label: 'Dolor leve' },
        { min: 4, max: 6, label: 'Dolor moderado' },
        { min: 7, label: 'Dolor severo' },
      ],
    },
    alertRule: { min: 7, severity: 'HIGH', message: 'Dolor severo (FLACC ≥7)' },
  },

  // ===== Borradores (requieren validación clínica antes de activar) =====
  {
    code: 'MMSE',
    name: 'Mini-Mental State Examination',
    category: ScaleCategory.COGNITIVE,
    description: '[BORRADOR · validar] Suma 0–30. Ajustar por escolaridad.',
    isActive: false,
    schema: {
      type: 'sum',
      items: 'ítems agrupados, total 0–30',
      interpretationBands: [
        { min: 27, label: 'Normal' },
        { min: 21, max: 26, label: 'Deterioro leve' },
        { min: 11, max: 20, label: 'Deterioro moderado' },
        { max: 10, label: 'Deterioro severo' },
      ],
    },
    alertRule: { max: 20, severity: 'MEDIUM', message: 'Deterioro cognitivo moderado-severo (MMSE)' },
  },
  {
    code: 'PAP_SCORE',
    name: 'Palliative Prognostic Score (PaP)',
    category: ScaleCategory.PROGNOSTIC,
    description: '[BORRADOR · validar] Suma ponderada (rango 0–17.5) → 3 grupos de supervivencia a 30 días.',
    isActive: false,
    schema: {
      type: 'sum',
      items: '6 ítems ponderados (disnea, anorexia, KPS, predicción clínica, leucocitos, % linfocitos)',
      interpretationBands: [
        { max: 5.5, label: 'Grupo A (>70% a 30 días)' },
        { min: 5.6, max: 11, label: 'Grupo B (30–70%)' },
        { min: 11.1, label: 'Grupo C (<30%)' },
      ],
    },
    alertRule: { min: 11.1, severity: 'HIGH', message: 'PaP grupo C: alta probabilidad de fallecimiento a corto plazo' },
  },
  {
    code: 'PG_MSAS',
    name: 'Memorial Symptom Assessment Scale (corta/pediátrica)',
    category: ScaleCategory.SYMPTOM,
    description: '[BORRADOR · validar] Multidimensional (malestar por síntoma 0–4). Confirmar versión.',
    isActive: false,
    schema: { type: 'multi-numeric', scale: { min: 0, max: 4 }, items: 'lista de síntomas con malestar 0–4' },
    alertRule: { itemMin: 3, severity: 'MEDIUM', message: 'Síntoma con malestar alto (MSAS)' },
  },
  {
    code: 'FLACC_R',
    name: 'FLACC-R (revisada, deterioro cognitivo)',
    category: ScaleCategory.PAIN,
    description: '[BORRADOR · validar] 5 ítems 0–2 con descriptores ampliados. Total 0–10.',
    isActive: false,
    schema: {
      type: 'sum',
      items: '5 ítems 0–2 con descriptores específicos',
      interpretationBands: [
        { max: 3, label: 'Leve' },
        { min: 4, max: 6, label: 'Moderado' },
        { min: 7, label: 'Severo' },
      ],
    },
    alertRule: { min: 7, severity: 'HIGH', message: 'Dolor severo (FLACC-R ≥7)' },
  },
  {
    code: 'COMFORT_B',
    name: 'COMFORT-B (sedación / distress conductual)',
    category: ScaleCategory.PAIN,
    description: '[BORRADOR · validar] 6 ítems 1–5. Total 6–30.',
    isActive: false,
    schema: {
      type: 'sum',
      items: '6 ítems conductuales 1–5',
      interpretationBands: [
        { max: 10, label: 'Sedación profunda' },
        { min: 11, max: 22, label: 'Confort adecuado' },
        { min: 23, label: 'Distress / dolor' },
      ],
    },
    alertRule: { min: 23, severity: 'HIGH', message: 'Distress no controlado (COMFORT-B ≥23)' },
  },
  {
    code: 'EQ5D',
    name: 'EQ-5D (5 dimensiones + EVA)',
    category: ScaleCategory.QUALITY_OF_LIFE,
    description: '[BORRADOR · validar] Perfil 5D (1–5) + EVA 0–100. El índice requiere value-set por país.',
    isActive: false,
    schema: {
      type: 'transform',
      transform: 'eq5d_index',
      dimensions: ['movilidad', 'autocuidado', 'actividades', 'dolor', 'ansiedad'],
      vas: { min: 0, max: 100 },
    },
    alertRule: { vasMax: 40, severity: 'LOW', message: 'Calidad de vida autopercibida baja (EVA<40)' },
  },
  {
    code: 'PEDSQL',
    name: 'PedsQL (calidad de vida pediátrica)',
    category: ScaleCategory.QUALITY_OF_LIFE,
    description: '[BORRADOR · validar] Ítems 0–4 → recodificados y promediados a 0–100. Versión por edad.',
    isActive: false,
    schema: { type: 'transform', transform: 'pedsql_linear', itemRange: [0, 4], scaleOut: [0, 100] },
    alertRule: { scoreMax: 70, severity: 'LOW', message: 'Calidad de vida baja (PedsQL<70)' },
  },
  {
    code: 'IDC_PAL',
    name: 'Instrumento Diagnóstico de la Complejidad en Paliativos',
    category: ScaleCategory.COMPLEXITY,
    description: '[BORRADOR · validar] Checklist de elementos de complejidad → nivel resultante.',
    isActive: false,
    schema: {
      type: 'classification',
      groups: ['dependientes del paciente', 'de la familia', 'del equipo/organización'],
      levels: ['no complejo', 'complejo', 'altamente complejo'],
      rule: 'máximo nivel presente entre los elementos marcados',
    },
    alertRule: { level: 'altamente complejo', severity: 'HIGH', message: 'Caso altamente complejo (IDC-Pal)' },
  },
  {
    code: 'NANEAS',
    name: 'Niños/Adolescentes con Necesidades Especiales de Atención en Salud',
    category: ScaleCategory.COMPLEXITY,
    description: '[BORRADOR · validar] Clasificación de complejidad pediátrica (baja/mediana/alta).',
    isActive: false,
    schema: { type: 'classification', levels: ['baja', 'mediana', 'alta complejidad'], axes: 'ejes de necesidad/uso de recursos' },
    alertRule: { level: 'alta complejidad', severity: 'MEDIUM', message: 'NANEAS de alta complejidad' },
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
    const isActive = (s as { isActive?: boolean }).isActive ?? true
    await prisma.scaleDefinition.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        category: s.category,
        description: s.description,
        schema: s.schema,
        alertRule: s.alertRule,
        isActive,
      },
      create: { ...s, isActive },
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
