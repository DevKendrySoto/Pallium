/** Contenido del access token. Incluye permisos para no golpear la DB por request. */
export interface JwtPayload {
  sub: string // userId
  email: string
  roles: string[]
  permissions: string[]
}

/** Contenido del refresh token (mínimo: solo identifica al usuario). */
export interface RefreshPayload {
  sub: string
}
