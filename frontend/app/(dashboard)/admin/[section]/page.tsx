'use client'

import { notFound, useParams } from 'next/navigation'
import { PlaceholderScreen } from '@/components/admin/placeholder-screen'

/** Catálogo de secciones placeholder de Administración (fases siguientes). */
const SECTIONS: Record<string, { title: string; phase: number; description: string }> = {
  reportes: {
    title: 'Reportes',
    phase: 4,
    description:
      'Panel de reportes y analítica de la clínica: producción por profesional, cobertura de visitas, tasas de completitud y cadencia, indicadores de calidad y exportaciones.',
  },
  estado: {
    title: 'Estado del sistema',
    phase: 7,
    description:
      'Salud del sistema: estado de la base de datos, colas y worker de cadencia, proveedor de WhatsApp, almacenamiento y últimas ejecuciones de tareas programadas.',
  },
  plantillas: {
    title: 'Plantillas clínicas',
    phase: 6,
    description:
      'Editor de plantillas clínicas por rol y categoría de paciente: secciones, componentes y versiones del registro clínico dinámico.',
  },
  escalas: {
    title: 'Escalas',
    phase: 6,
    description:
      'Catálogo de escalas de valoración (funcionales, pronósticas, de síntomas): definición de ítems, puntajes y reglas de alerta.',
  },
  'reglas-alertas': {
    title: 'Reglas de alertas',
    phase: 3,
    description:
      'Configuración de reglas y umbrales de alertas, severidades y SLA por tipo, además del enrutamiento a roles responsables.',
  },
  notificaciones: {
    title: 'Notificaciones',
    phase: 7,
    description:
      'Configuración de canales y plantillas de notificación (WhatsApp y otros), reintentos automáticos y bitácora de envíos.',
  },
}

export default function AdminPlaceholderPage() {
  const { section } = useParams<{ section: string }>()
  const meta = SECTIONS[section]
  if (!meta) notFound()
  return <PlaceholderScreen title={meta.title} phase={meta.phase} description={meta.description} />
}
