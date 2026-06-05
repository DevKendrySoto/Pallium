import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { ApiException } from '@/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Adjunta el Bearer token automáticamente (por defecto true). */
  auth?: boolean
  body?: unknown
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Normaliza el error de NestJS ({ statusCode, error, message }) a { code, message }. */
function normalize(body: Record<string, unknown> | null, status: number): ApiException {
  const rawMessage = body?.message
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : 'Ocurrió un error inesperado'
  const code =
    (typeof body?.code === 'string' && body.code) ||
    (typeof body?.error === 'string' && body.error) ||
    'ERROR'
  return new ApiException({ code, message, status })
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options
  const token = useAuthStore.getState().token

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  // 401 → cerrar sesión y volver a login.
  if (res.status === 401) {
    useAuthStore.getState().logout()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiException({ code: 'UNAUTHORIZED', message: 'Sesión expirada', status: 401 })
  }

  // 403 → aviso de permisos.
  if (res.status === 403) {
    toast.error('No tienes permisos para esta acción')
    throw new ApiException({ code: 'FORBIDDEN', message: 'Sin permisos', status: 403 })
  }

  if (!res.ok) {
    throw normalize(await safeJson(res), res.status)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
