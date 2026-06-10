import { ALL, MEDICO_PERMISSIONS, PERMISSIONS, ROLES } from '../prisma/rbac'

function permsOf(code: string): Set<string> {
  const r = ROLES.find((x) => x.code === code)
  if (!r) throw new Error(`rol ${code} no existe`)
  return new Set(r.permissions === '*' ? ALL : r.permissions)
}

describe('RBAC: permisos de administración (Fase 1 admin)', () => {
  it('user:request lo tienen ADMIN y COORDINADOR_MEDICO', () => {
    expect(permsOf('ADMIN').has('user:request')).toBe(true)
    expect(permsOf('COORDINADOR_MEDICO').has('user:request')).toBe(true)
  })

  it('admin:operate es exclusivo de ADMIN', () => {
    const holders = ROLES.filter((r) => (r.permissions === '*' ? ALL : r.permissions).includes('admin:operate')).map(
      (r) => r.code,
    )
    expect(holders).toEqual(['ADMIN'])
  })

  it('el coordinador NO puede aprobar (sin admin:operate)', () => {
    expect(permsOf('COORDINADOR_MEDICO').has('admin:operate')).toBe(false)
  })
})

describe('RBAC: reorganización Coordinador médico', () => {
  it('el catálogo incluye los nuevos permisos y ya no incluye patient:approve', () => {
    expect(PERMISSIONS['patient:create']).toBeDefined()
    expect(PERMISSIONS['patient:change-status']).toBeDefined()
    expect(PERMISSIONS['route:assign-clinical-team']).toBeDefined()
    expect(PERMISSIONS['patient:approve']).toBeUndefined()
  })

  it('COORDINADOR_MEDICO existe con el nombre correcto', () => {
    const r = ROLES.find((x) => x.code === 'COORDINADOR_MEDICO')
    expect(r?.name).toBe('Coordinador médico')
  })

  it('COORDINADOR_MEDICO hereda TODOS los permisos de MEDICO', () => {
    const coord = permsOf('COORDINADOR_MEDICO')
    for (const p of MEDICO_PERMISSIONS) {
      expect(coord.has(p)).toBe(true)
    }
  })

  it('COORDINADOR_MEDICO suma create, change-status y asignación de equipo clínico', () => {
    const coord = permsOf('COORDINADOR_MEDICO')
    expect(coord.has('patient:create')).toBe(true)
    expect(coord.has('patient:change-status')).toBe(true)
    expect(coord.has('route:assign-clinical-team')).toBe(true)
  })

  it('MEDICO ya NO puede crear pacientes ni cambiar estado', () => {
    const medico = permsOf('MEDICO')
    expect(medico.has('patient:create')).toBe(false)
    expect(medico.has('patient:change-status')).toBe(false)
    expect(medico.has('patient:approve' as string)).toBe(false)
  })

  it('crear pacientes y cambiar estado: solo ADMIN y COORDINADOR_MEDICO', () => {
    for (const cap of ['patient:create', 'patient:change-status']) {
      const holders = ROLES.filter((r) => (r.permissions === '*' ? ALL : r.permissions).includes(cap)).map(
        (r) => r.code,
      )
      expect(holders.sort()).toEqual(['ADMIN', 'COORDINADOR_MEDICO'])
    }
  })

  it('asignar equipo clínico a rutas: solo ADMIN y COORDINADOR_MEDICO (no AGENDA)', () => {
    const holders = ROLES.filter((r) =>
      (r.permissions === '*' ? ALL : r.permissions).includes('route:assign-clinical-team'),
    ).map((r) => r.code)
    expect(holders.sort()).toEqual(['ADMIN', 'COORDINADOR_MEDICO'])
    expect(holders).not.toContain('AGENDA')
  })

  it('AGENDA conserva crear ruta y asignar chofer, pero NO el equipo clínico', () => {
    const agenda = permsOf('AGENDA')
    expect(agenda.has('route:create')).toBe(true)
    expect(agenda.has('route:update')).toBe(true) // chofer/paradas
    expect(agenda.has('route:assign-clinical-team')).toBe(false)
  })
})
