import { borrarSesion, obtenerToken } from '../lib/sesion'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** Error con el ProblemDetail del backend: `detail` y, si hay, los errores por campo. */
export class ApiError extends Error {
  readonly status: number
  readonly errores: Record<string, string>

  constructor(status: number, mensaje: string, errores: Record<string, string> = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
  }
}

interface ProblemDetail {
  title?: string
  detail?: string
  errores?: Record<string, string>
}

export async function api<T>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = obtenerToken()
  const headers: Record<string, string> = {}
  if (opciones.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: opciones.method ?? 'GET',
      headers,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  // Token vencido o inválido: se cierra la sesión y se manda al login.
  // Sin token (por ejemplo, contraseña incorrecta en el login) el 401 se muestra como un error normal.
  if (respuesta.status === 401 && token) {
    borrarSesion()
    window.location.replace('/login?sesion=expirada')
    throw new ApiError(401, 'Tu sesión venció. Inicia sesión de nuevo.')
  }

  if (!respuesta.ok) {
    const problema = await leerJson<ProblemDetail>(respuesta)
    throw new ApiError(
      respuesta.status,
      problema?.detail ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      problema?.errores ?? {},
    )
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

async function leerJson<T>(respuesta: Response): Promise<T | null> {
  try {
    return (await respuesta.json()) as T
  } catch {
    return null
  }
}
