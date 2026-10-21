import { api } from './client'

export type EstadoCita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'

export const NOMBRE_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  COMPLETADA: 'Atendida',
  NO_ASISTIO: 'No vino',
  CANCELADA: 'Cancelada',
}

export interface Cita {
  id: string
  cliente: { id: string; nombre: string; telefono: string }
  inicio: string
  duracionMinutos: number
  servicio: string
  precio: number | null
  estado: EstadoCita
  notas: string | null
}

export interface CitaRequest {
  clienteId: string
  inicio: string
  duracionMinutos: number
  servicio: string
  precio: number | null
  estado: EstadoCita
  notas: string | null
}

export const listarCitas = (desde: Date, hasta: Date) =>
  api<Cita[]>(`/api/citas?desde=${encodeURIComponent(desde.toISOString())}&hasta=${encodeURIComponent(hasta.toISOString())}`)

export const listarCitasDeCliente = (clienteId: string) =>
  api<Cita[]>(`/api/citas?clienteId=${encodeURIComponent(clienteId)}`)

export const obtenerCita = (id: string) => api<Cita>(`/api/citas/${id}`)

export const crearCita = (datos: CitaRequest) => api<Cita>('/api/citas', { method: 'POST', body: datos })

export const actualizarCita = (id: string, datos: CitaRequest) =>
  api<Cita>(`/api/citas/${id}`, { method: 'PUT', body: datos })

export const cambiarEstadoCita = (id: string, estado: EstadoCita) =>
  api<Cita>(`/api/citas/${id}/estado`, { method: 'PATCH', body: { estado } })

export const eliminarCita = (id: string) => api<void>(`/api/citas/${id}`, { method: 'DELETE' })
