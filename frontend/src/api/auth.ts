import { api } from './client'

export interface TokenResponse {
  token: string
  expiraEn: string
}

export interface Salon {
  id: string
  nombre: string
  email: string
}

export interface RegistroRequest {
  nombre: string
  email: string
  password: string
  telefono?: string
}

export const registrar = (datos: RegistroRequest) =>
  api<TokenResponse>('/api/auth/register', { method: 'POST', body: datos })

export const iniciarSesion = (email: string, password: string) =>
  api<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password } })

export const obtenerSalon = () => api<Salon>('/api/me')
