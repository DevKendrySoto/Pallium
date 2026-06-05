import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import type { JwtPayload } from '../types/jwt-payload'

/**
 * Valida el access token y deja el usuario en `request.user`.
 * Los permisos viajan en el token, así que no consultamos la DB aquí.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    })
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload?.sub) throw new UnauthorizedException()
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      isReadOnly: payload.isReadOnly ?? false,
    }
  }
}
