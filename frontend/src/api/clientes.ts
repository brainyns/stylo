import { api } from './client'

export interface Cliente {
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

export interface ClienteRequest {
  nombre: string
  telefono: string
  tono: string | null
  formula: string | null
  frecuenciaSemanas: number
  notas: string | null
}

export const listarClientes = () => api<Cliente[]>('/api/clientes')

export const obtenerCliente = (id: string) => api<Cliente>(`/api/clientes/${id}`)

export const crearCliente = (datos: ClienteRequest) =>
  api<Cliente>('/api/clientes', { method: 'POST', body: datos })

export const actualizarCliente = (id: string, datos: ClienteRequest) =>
  api<Cliente>(`/api/clientes/${id}`, { method: 'PUT', body: datos })

export const eliminarCliente = (id: string) => api<void>(`/api/clientes/${id}`, { method: 'DELETE' })
