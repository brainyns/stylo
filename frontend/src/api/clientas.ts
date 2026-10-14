import { api } from './client'

export interface Clienta {
  id: string
  nombre: string
  telefono: string
  tono: string | null
  formula: string | null
  frecuenciaSemanas: number
  notas: string | null
  creadoEn: string
  actualizadoEn: string
}

export interface ClientaRequest {
  nombre: string
  telefono: string
  tono: string | null
  formula: string | null
  frecuenciaSemanas: number
  notas: string | null
}

export const listarClientas = () => api<Clienta[]>('/api/clientas')

export const obtenerClienta = (id: string) => api<Clienta>(`/api/clientas/${id}`)

export const crearClienta = (datos: ClientaRequest) =>
  api<Clienta>('/api/clientas', { method: 'POST', body: datos })

export const actualizarClienta = (id: string, datos: ClientaRequest) =>
  api<Clienta>(`/api/clientas/${id}`, { method: 'PUT', body: datos })

export const eliminarClienta = (id: string) => api<void>(`/api/clientas/${id}`, { method: 'DELETE' })
