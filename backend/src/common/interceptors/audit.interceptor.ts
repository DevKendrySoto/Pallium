import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import { AuditAction } from '@prisma/client'
import type { Request } from 'express'
import { type Observable, tap } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'
import type { AuthenticatedUser } from '../types/authenticated-user'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
}

/**
 * Registra en AuditLog las acciones de mutación exitosas (quién, qué, cuándo).
 * Append-only; el fallo de auditoría nunca rompe la respuesta.
 * Nota: guarda un `after` mínimo ({ id }) para no persistir datos sensibles;
 * el diff completo (before/after) por entidad queda como mejora futura.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()

    if (SAFE_METHODS.has(req.method)) return next.handle()

    return next.handle().pipe(
      tap((response) => {
        void this.record(req, response)
      }),
    )
  }

  private resolveAction(path: string, method: string): AuditAction {
    if (path.endsWith('/auth/login')) return AuditAction.LOGIN
    if (path.endsWith('/auth/logout')) return AuditAction.LOGOUT
    if (path.endsWith('/status')) return AuditAction.STATUS_TRANSITION
    if (path.endsWith('/dispatch')) return AuditAction.DISPATCH
    return METHOD_ACTION[method] ?? AuditAction.UPDATE
  }

  /** "patients" a partir de /api/patients/:id?… */
  private resolveEntityType(path: string): string {
    const clean = path.split('?')[0].replace(/^\/api\//, '')
    return clean.split('/')[0] || 'unknown'
  }

  private async record(
    req: Request & { user?: AuthenticatedUser },
    response: unknown,
  ): Promise<void> {
    try {
      const path = req.originalUrl ?? req.url
      const action = this.resolveAction(path, req.method)
      const entityType = this.resolveEntityType(path)

      const params = (req.params ?? {}) as Record<string, string>
      const body = (req.body ?? {}) as Record<string, unknown>
      const res = (response ?? {}) as Record<string, unknown>
      const entityId =
        (typeof res.id === 'string' && res.id) ||
        params.id ||
        (typeof body.id === 'string' && body.id) ||
        null

      // actor: usuario autenticado, o el usuario devuelto por el login.
      const loginUser = (res.user ?? {}) as { id?: string }
      const actorId = req.user?.id ?? (action === AuditAction.LOGIN ? loginUser.id : undefined)

      await this.prisma.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action,
          entityType,
          entityId,
          after: entityId ? { id: entityId } : undefined,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      })
    } catch {
      // La auditoría nunca debe romper la operación principal.
    }
  }
}
