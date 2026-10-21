const FORMATO_PRECIO = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const FORMATO_HORA = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
const FORMATO_DIA_LARGO = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
const FORMATO_MES = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
const FORMATO_DIA_SEMANA = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** 35000 → "$ 35.000" */
export const formatearPrecio = (precio: number) => FORMATO_PRECIO.format(precio)

/** "3:00 p. m." */
export const formatearHora = (fecha: Date | string) => FORMATO_HORA.format(new Date(fecha))

/** "vie, 24 oct" */
export const formatearFechaCorta = (fecha: Date | string) => FORMATO_FECHA_CORTA.format(new Date(fecha))

/** "viernes, 24 de octubre" */
export const formatearDiaLargo = (fecha: Date | string) => FORMATO_DIA_LARGO.format(new Date(fecha))

/** "octubre de 2026" */
export const formatearMes = (fecha: Date) => FORMATO_MES.format(fecha)

/** "lun" */
export const formatearDiaSemana = (fecha: Date) => FORMATO_DIA_SEMANA.format(fecha).replace('.', '')

/** Fecha local como "2026-10-24" (la de un <input type="date">). */
export function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/** "2026-10-24" → medianoche local de ese día, o null si no es una fecha válida. */
export function desdeClave(clave: string | null): Date | null {
  const partes = clave?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!partes) return null
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/** Hora local como "15:00" (la de un <input type="time">). */
export function claveHora(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

/** Lunes de la semana de la fecha. */
export function inicioDeSemana(fecha: Date): Date {
  const dia = fecha.getDay() // 0 = domingo
  return sumarDias(inicioDelDia(fecha), dia === 0 ? -6 : 1 - dia)
}

/** Días de calendario desde hoy hasta la fecha: 0 hoy, 1 mañana, -1 ayer. */
export function diasDesdeHoy(fecha: Date | string): number {
  return Math.round((inicioDelDia(new Date(fecha)).getTime() - inicioDelDia(new Date()).getTime()) / MS_POR_DIA)
}

const dias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

/** "Le toca hoy", "Le toca en 3 días", "Atrasado 5 días". */
export function describirCuandoVuelve(leTocaVolver: string): string {
  const d = diasDesdeHoy(leTocaVolver)
  if (d === 0) return 'Le toca hoy'
  return d > 0 ? `Le toca en ${dias(d)}` : `Atrasado ${dias(-d)}`
}
