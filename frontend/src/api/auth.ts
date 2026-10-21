import { api } from './client'

export interface TokenResponse {
  token: string
  expiraEn: string
}

export type TipoNegocio = 'PELUQUERIA' | 'BARBERIA' | 'MIXTO'

export const NOMBRE_TIPO_NEGOCIO: Record<TipoNegocio, string> = {
  PELUQUERIA: 'Peluquería',
  BARBERIA: 'Barbería',
  MIXTO: 'Peluquería y barbería',
}

export interface Salon {
  id: string
  nombre: string
  email: string
  tipo: TipoNegocio
}

export interface RegistroRequest {
  nombre: string
  email: string
  password: string
  telefono?: string
  tipo: TipoNegocio
}

export const registrar = (datos: RegistroRequest) =>
  api<TokenResponse>('/api/auth/register', { method: 'POST', body: datos })

export const iniciarSesion = (email: string, password: string) =>
  api<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password } })

export const obtenerSalon = () => api<Salon>('/api/me')
