/** Datos mínimos de una parada para construir el mensaje del chofer. */
export interface StopForMessage {
  sequence: number
  plannedArrival: Date | null
  patientName: string
  addressLine: string | null
  city: string | null
  reference: string | null
}

export interface RouteForMessage {
  name: string | null
  routeDate: Date
  driverName: string
  stops: StopForMessage[]
}

function fmtTime(d: Date | null): string {
  if (!d) return '--:--'
  return d.toISOString().slice(11, 16) // HH:MM en UTC
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Arma el texto de WhatsApp que recibe el chofer. Sin lógica de I/O: dominio puro.
 */
export function buildDriverMessage(route: RouteForMessage): string {
  const header = [
    `🚐 *Ruta domiciliaria* — ${route.name ?? fmtDate(route.routeDate)}`,
    `Fecha: ${fmtDate(route.routeDate)}`,
    `Chofer: ${route.driverName}`,
    `Paradas: ${route.stops.length}`,
    '',
  ]

  const body = route.stops.map((s) => {
    const lines = [
      `${s.sequence}. *${s.patientName}* (${fmtTime(s.plannedArrival)})`,
      s.addressLine ? `   📍 ${s.addressLine}${s.city ? `, ${s.city}` : ''}` : null,
      s.reference ? `   ℹ️ ${s.reference}` : null,
    ]
    return lines.filter(Boolean).join('\n')
  })

  return [...header, ...body].join('\n')
}
