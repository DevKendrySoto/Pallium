import { createHash } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import type { JwtPayload, RefreshPayload } from './types/jwt-payload'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** SHA-256 determinista para indexar el refresh token (el token ya es alta entropía). */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private async validateCredentials(email: string, password: string) {
    const user = await this.users.findByEmail(email)
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas')
    const ok = await argon2.verify(user.passwordHash, password)
    if (!ok) throw new UnauthorizedException('Credenciales inválidas')
    return user
  }

  private async issueTokens(ctx: AuthenticatedUser): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: ctx.id,
      email: ctx.email,
      roles: ctx.roles,
      permissions: ctx.permissions,
    }
    const refreshPayload: RefreshPayload = { sub: ctx.id }

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow('jwt.accessSecret'),
      expiresIn: this.config.getOrThrow('jwt.accessTtl'),
    })
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow('jwt.refreshSecret'),
      expiresIn: this.config.getOrThrow('jwt.refreshTtl'),
    })

    await this.persistRefreshToken(ctx.id, refreshToken)
    return { accessToken, refreshToken }
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const decoded = this.jwt.decode<{ exp: number }>(refreshToken)
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    })
  }

  async login(email: string, password: string) {
    const user = await this.validateCredentials(email, password)
    const ctx = this.users.toAuthContext(user)
    const tokens = await this.issueTokens(ctx)
    await this.users.touchLastLogin(user.id)
    return { ...tokens, user: ctx }
  }

  /** Rotación: valida el refresh, revoca el usado y emite un par nuevo. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: RefreshPayload
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow('jwt.refreshSecret'),
      })
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado')
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión no válida')
    }

    // Revoca el token usado (rotación de un solo uso).
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const user = await this.users.findById(payload.sub)
    if (!user || !user.isActive) throw new UnauthorizedException()

    return this.issueTokens(this.users.toAuthContext(user))
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
