import type { Cita } from './citas'
import { api } from './client'

/** Lo cobrado en un periodo (COP) y en cuántas citas atendidas. */
export interface Periodo {
  total: number
  cobros: number
}

export interface Panel {
  /** Fecha de hoy en Colombia, "2026-10-22". */
  hoy: string
  ingresos: {
    hoy: Periodo
    semana: Periodo
    mes: Periodo
    /** Del 1 al mismo día del mes pasado, para comparar cortes iguales. */
    mesAnteriorAlMismoDia: Periodo
    /** Del mes en curso; null si aún no hay cobros. */
    ticketPromedio: number | null
    cobrosPorDia: number
  }
  /** Últimos 30 días, del más antiguo a hoy. */
  ingresosPorDia: { fecha: string; total: number; cobros: number }[]
  citasHoy: Cita[]
  proximasCitas: Cita[]
  /** Últimos 90 días. */
  serviciosTop: { servicio: string; veces: number; total: number }[]
  /** Últimos 90 días. */
  clientesFrecuentes: { id: string; nombre: string; visitas: number; gastado: number }[]
  clientes: {
    nuevosMes: number
    recurrentesMes: number
    visitasMes: number
    atendidosMes: number
    /** Últimos 6 meses, "2026-10". */
    porMes: { mes: string; nuevos: number; recurrentes: number }[]
  }
}

export const obtenerPanel = () => api<Panel>('/api/panel')
