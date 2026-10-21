import type { TipoNegocio } from '../api/auth'

const PELUQUERIA = ['Corte', 'Tinte', 'Retoque de raíz', 'Mechas', 'Cepillado', 'Keratina', 'Peinado']
const BARBERIA = ['Corte', 'Corte y barba', 'Barba', 'Afeitado clásico', 'Cejas', 'Tinte de barba']

/** Servicios que se ofrecen como atajo al agendar, según el tipo de negocio. */
export const SERVICIOS_SUGERIDOS: Record<TipoNegocio, string[]> = {
  PELUQUERIA,
  BARBERIA,
  MIXTO: [...new Set([...BARBERIA, ...PELUQUERIA])],
}

export const DURACIONES_MINUTOS = [15, 30, 45, 60, 90, 120, 180] as const

export const DURACION_POR_DEFECTO = 60

export function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}
