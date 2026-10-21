export const TONOS = [
  'Negro',
  'Castaño oscuro',
  'Castaño claro',
  'Rubio oscuro',
  'Rubio claro',
  'Platino',
  'Cobrizo',
  'Rojo',
  'Caoba',
  'Fantasía',
] as const

// Desde 2 semanas para cortes de barbería hasta 10 para retoques de color
export const FRECUENCIAS_SEMANAS = [2, 3, 4, 5, 6, 8, 10] as const

export const FRECUENCIA_POR_DEFECTO = 5

const COLOR_TONO: Record<string, string> = {
  Negro: '#1f1b1a',
  'Castaño oscuro': '#3d2a1f',
  'Castaño claro': '#7a5434',
  'Rubio oscuro': '#a27b4b',
  'Rubio claro': '#dcc08a',
  Platino: '#ebe6db',
  Cobrizo: '#b4562b',
  Rojo: '#a3202d',
  Caoba: '#6c2a25',
  Fantasía: 'conic-gradient(#d946ef, #6366f1, #06b6d4, #22c55e, #eab308, #d946ef)',
}

/** Fondo CSS para el círculo del tono, o null si el cliente no tiene un tono de la lista. */
export function colorDeTono(tono: string | null | undefined): string | null {
  return tono ? (COLOR_TONO[tono] ?? null) : null
}

/** "3001234567" → "300 123 4567" */
export function formatearTelefono(telefono: string): string {
  return /^\d{10}$/.test(telefono)
    ? `${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`
    : telefono
}

/** Minúsculas y sin tildes, para buscar "maria" y encontrar "María". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
