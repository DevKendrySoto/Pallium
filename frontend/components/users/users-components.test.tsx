import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { passwordScore } from './password-strength-meter'
import { RoleBadge } from './role-badge'
import { initials, roleMeta } from './role-meta'
import { UserAvatar } from './user-avatar'

describe('users components', () => {
  it('passwordScore aplica las 4 reglas', () => {
    expect(passwordScore('abc').score).toBe(0)
    expect(passwordScore('Abcdefg1').score).toBe(3) // sin símbolo
    expect(passwordScore('Abcdef1!').score).toBe(4)
  })

  it('initials y roleMeta', () => {
    expect(initials('Ana Pérez López')).toBe('AP')
    expect(roleMeta('MEDICO').label).toBe('Médico')
    expect(roleMeta('DESCONOCIDO').label).toBe('DESCONOCIDO')
  })

  it('RoleBadge muestra la etiqueta del rol', () => {
    render(<RoleBadge code="ENFERMERIA" />)
    expect(screen.getByText('Enfermería')).toBeDefined()
  })

  it('UserAvatar muestra las iniciales', () => {
    render(<UserAvatar name="Juan Pérez" roleCode="ADMIN" />)
    expect(screen.getByText('JP')).toBeDefined()
  })
})
