import { useEffect, useState, type MouseEvent } from 'react'
import { NOMBRE_ESTADO, type Cita, type EstadoCita } from '../api/citas'
import { claveDia, formatearDiaLargo, formatearDiaSemana, formatearHora } from '../lib/formato'
import { formatearDuracion } from '../lib/servicios'

/** Alto en píxeles de una hora. Media hora (32px) es el hueco más chico que se puede tocar. */
const ALTO_HORA = 64
const HORARIO_MINIMO = { desde: 8, hasta: 20 }

// Mismos colores que la insignia de estado; el texto del estado acompaña siempre al color
const ESTILO_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'border-sky-500 bg-sky-50 text-sky-950 hover:bg-sky-100',
  COMPLETADA: 'border-marca-500 bg-marca-50 text-marca-800 hover:bg-marca-100',
  NO_ASISTIO: 'border-amber-500 bg-amber-50 text-amber-950 hover:bg-amber-100',
  CANCELADA: 'border-stone-400 bg-stone-100 text-stone-600',
}

const ICONO_ESTADO: Partial<Record<EstadoCita, string>> = { COMPLETADA: '✓', NO_ASISTIO: '✕' }

interface Ubicada {
  cita: Cita
  minutoInicio: number
  minutoFin: number
  carril: number
  carriles: number
}

const minutosDelDia = (fecha: Date) => fecha.getHours() * 60 + fecha.getMinutes()

/**
 * Reparte las citas que se cruzan en carriles, para mostrarlas lado a lado.
 * Cada grupo de citas encadenadas usa tantos carriles como su mayor cruce.
 */
function ubicar(citas: Cita[]): Ubicada[] {
  const ordenadas = citas
    .map((cita) => {
      const inicio = minutosDelDia(new Date(cita.inicio))
      return { cita, minutoInicio: inicio, minutoFin: Math.min(inicio + cita.duracionMinutos, 24 * 60), carril: 0, carriles: 1 }
    })
    .sort((a, b) => a.minutoInicio - b.minutoInicio || b.minutoFin - a.minutoFin)

  const resultado: Ubicada[] = []
  let grupo: Ubicada[] = []
  let finGrupo = -1
  const cerrarGrupo = () => {
    const carriles = Math.max(1, ...grupo.map((u) => u.carril + 1))
    for (const u of grupo) u.carriles = carriles
    resultado.push(...grupo)
    grupo = []
  }
  for (const u of ordenadas) {
    if (u.minutoInicio >= finGrupo && grupo.length > 0) cerrarGrupo()
    const ocupados = new Set(grupo.filter((g) => g.minutoFin > u.minutoInicio).map((g) => g.carril))
    while (ocupados.has(u.carril)) u.carril++
    grupo.push(u)
    finGrupo = Math.max(finGrupo, u.minutoFin)
  }
  if (grupo.length > 0) cerrarGrupo()
  return resultado
}

/** Horas visibles: de 8 a. m. a 8 p. m., o más si alguna cita se sale de ese horario. */
function rangoHoras(citas: Cita[]): { desde: number; hasta: number } {
  let desde = HORARIO_MINIMO.desde
  let hasta = HORARIO_MINIMO.hasta
  for (const cita of citas) {
    const inicio = new Date(cita.inicio)
    desde = Math.min(desde, inicio.getHours())
    hasta = Math.max(hasta, Math.ceil((minutosDelDia(inicio) + cita.duracionMinutos) / 60))
  }
  return { desde, hasta: Math.min(hasta, 24) }
}

const etiquetaHora = (hora: number) =>
  new Intl.DateTimeFormat('es-CO', { hour: 'numeric' }).format(new Date(2000, 0, 1, hora)).replace(/\s/g, ' ')

/** La hora actual, refrescada cada minuto, para la línea de "ahora". */
function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return ahora
}

interface Props {
  dias: Date[]
  /** Citas por día ("2026-10-22"), sin las canceladas. */
  citasPorDia: Map<string, Cita[]>
  onAbrir: (cita: Cita) => void
  /** Al tocar un hueco libre: el día y la hora redondeada a la media hora, "15:30". */
  onNueva: (dia: Date, hora: string) => void
  /** En la vista de semana, tocar el encabezado de un día abre ese día. */
  onElegirDia?: (dia: Date) => void
}

export function CalendarioCitas({ dias, citasPorDia, onAbrir, onNueva, onElegirDia }: Props) {
  const ahora = useAhora()
  const todas = dias.flatMap((d) => citasPorDia.get(claveDia(d)) ?? [])
  const { desde, hasta } = rangoHoras(todas)
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i)
  const alto = horas.length * ALTO_HORA
  const semana = dias.length > 1
  const claveHoy = claveDia(ahora)
  const minutoAhora = minutosDelDia(ahora)

  function tocarHueco(e: MouseEvent<HTMLDivElement>, dia: Date) {
    // Solo el fondo de la columna; los bloques de cita tienen su propio clic
    if (e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const minutos = desde * 60 + Math.floor((y / ALTO_HORA) * 2) * 30
    const hora = `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
    onNueva(dia, hora)
  }

  return (
    <div className={semana ? '-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0' : ''}>
      <div className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${semana ? 'min-w-[44rem]' : ''}`}>
        {semana && (
          <div className="sticky top-0 z-10 flex rounded-t-2xl border-b border-stone-200 bg-white/95 backdrop-blur">
            <div className="w-14 shrink-0" />
            {dias.map((d) => {
              const clave = claveDia(d)
              const esHoy = clave === claveHoy
              const cantidad = citasPorDia.get(clave)?.length ?? 0
              return (
                <button
                  key={clave}
                  type="button"
                  onClick={() => onElegirDia?.(d)}
                  aria-label={`Ver ${formatearDiaLargo(d)}${cantidad ? `, ${cantidad} citas` : ''}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-0.5 border-l border-stone-100 py-2 hover:bg-stone-50"
                >
                  <span className="text-[0.7rem] font-medium uppercase text-stone-500">{formatearDiaSemana(d)}</span>
                  <span
                    className={`flex size-8 items-center justify-center rounded-full text-base font-bold ${
                      esHoy ? 'bg-stone-950 text-marca-300' : 'text-stone-800'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex">
          {/* Horas a la izquierda, alineadas con las líneas de la cuadrícula */}
          <div className="relative w-14 shrink-0" style={{ height: alto }} aria-hidden="true">
            {horas.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[0.6875rem] tabular-nums text-stone-400"
                style={{ top: i * ALTO_HORA }}
              >
                {i > 0 && etiquetaHora(h)}
              </span>
            ))}
          </div>

          {dias.map((d) => {
            const clave = claveDia(d)
            const ubicadas = ubicar(citasPorDia.get(clave) ?? [])
            const mostrarAhora = clave === claveHoy && minutoAhora >= desde * 60 && minutoAhora < hasta * 60
            return (
              <div
                key={clave}
                role="group"
                aria-label={formatearDiaLargo(d)}
                onClick={(e) => tocarHueco(e, d)}
                className="relative min-w-0 flex-1 cursor-copy border-l border-stone-100"
                style={{
                  height: alto,
                  // Línea fuerte en cada hora y punteada suave en la media hora
                  backgroundImage: `linear-gradient(to bottom, var(--color-stone-200) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--color-stone-100) 1px, transparent 1px)`,
                  backgroundSize: `100% ${ALTO_HORA}px, 100% ${ALTO_HORA / 2}px`,
                }}
                title="Toca un espacio libre para agendar"
              >
                {ubicadas.map((u) => (
                  <BloqueCita key={u.cita.id} ubicada={u} desde={desde} compacto={semana} onAbrir={onAbrir} />
                ))}

                {mostrarAhora && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: ((minutoAhora - desde * 60) / 60) * ALTO_HORA }}
                    aria-hidden="true"
                  >
                    <span className="-ml-1 size-2 rounded-full bg-red-600" />
                    <span className="h-0.5 flex-1 bg-red-600" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BloqueCita({
  ubicada,
  desde,
  compacto,
  onAbrir,
}: {
  ubicada: Ubicada
  desde: number
  compacto: boolean
  onAbrir: (cita: Cita) => void
}) {
  const { cita, minutoInicio, minutoFin, carril, carriles } = ubicada
  const top = ((minutoInicio - desde * 60) / 60) * ALTO_HORA
  // 2px de aire abajo para que dos citas seguidas no se peguen
  const alto = Math.max(((minutoFin - minutoInicio) / 60) * ALTO_HORA - 2, 24)
  const corta = alto < 44
  const icono = ICONO_ESTADO[cita.estado]

  return (
    <button
      type="button"
      onClick={() => onAbrir(cita)}
      aria-label={`${formatearHora(cita.inicio)}, ${cita.cliente.nombre}, ${cita.servicio}, ${NOMBRE_ESTADO[cita.estado]}`}
      className={`absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm ring-1 ring-black/5 transition-colors focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-marca-600 ${ESTILO_ESTADO[cita.estado]}`}
      style={{
        top,
        height: alto,
        left: `calc(${(carril / carriles) * 100}% + 2px)`,
        width: `calc(${100 / carriles}% - 4px)`,
      }}
    >
      <p className={`flex items-center gap-1 font-semibold leading-tight ${corta ? 'truncate' : ''}`}>
        {icono && <span aria-hidden="true">{icono}</span>}
        <span className="truncate">{cita.cliente.nombre}</span>
      </p>
      {!corta && (
        <>
          <p className="truncate opacity-80">{cita.servicio}</p>
          {!compacto && (
            <p className="truncate opacity-70">
              {formatearHora(cita.inicio)} · {formatearDuracion(cita.duracionMinutos)} · {NOMBRE_ESTADO[cita.estado]}
            </p>
          )}
        </>
      )}
    </button>
  )
}
