import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { cambiarEstadoCita, listarCitas, type Cita, type EstadoCita } from '../api/citas'
import { EnlaceFlotante } from '../components/Layout'
import { AvisoError, Boton, EnlaceWhatsApp, InsigniaEstado, Spinner } from '../components/ui'
import {
  claveDia,
  desdeClave,
  formatearDiaLargo,
  formatearDiaSemana,
  formatearHora,
  formatearMes,
  formatearPrecio,
  inicioDeSemana,
  inicioDelDia,
  sumarDias,
} from '../lib/formato'
import { useNegocio } from '../lib/negocio'
import { formatearDuracion } from '../lib/servicios'
import { enlaceWhatsApp, mensajeRecordatorioCita } from '../lib/whatsapp'

export default function Agenda() {
  const { salon } = useNegocio()
  const location = useLocation()
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  const [params, setParams] = useSearchParams()
  const [hoy] = useState(() => inicioDelDia(new Date()))
  const dia = desdeClave(params.get('fecha')) ?? hoy
  const lunes = inicioDeSemana(dia)
  const claveLunes = claveDia(lunes)

  // Citas de la semana cargada; mientras llega otra semana, citas queda en null
  const [cargadas, setCargadas] = useState<{ semana: string; citas: Cita[] } | null>(null)
  const citas = cargadas?.semana === claveLunes ? cargadas.citas : null
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [marcando, setMarcando] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    const desde = desdeClave(claveLunes)!
    listarCitas(desde, sumarDias(desde, 7))
      .then((c) => activo && setCargadas({ semana: claveLunes, citas: c }))
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [claveLunes, intento])

  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  const porDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>()
    for (const cita of citas ?? []) {
      const clave = claveDia(new Date(cita.inicio))
      mapa.set(clave, [...(mapa.get(clave) ?? []), cita])
    }
    return mapa
  }, [citas])

  const delDia = porDia.get(claveDia(dia)) ?? []
  const activas = delDia.filter((c) => c.estado !== 'CANCELADA')
  const totalDia = activas.reduce((suma, c) => suma + (c.precio ?? 0), 0)
  const atendidas = delDia.filter((c) => c.estado === 'COMPLETADA').length

  function irA(fecha: Date) {
    setError(null)
    setParams({ fecha: claveDia(fecha) }, { replace: true })
  }

  async function marcar(cita: Cita, estado: EstadoCita) {
    setMarcando(cita.id)
    setError(null)
    try {
      const actualizada = await cambiarEstadoCita(cita.id, estado)
      setCargadas((actual) =>
        actual && { ...actual, citas: actual.citas.map((c) => (c.id === actualizada.id ? actualizada : c)) },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    } finally {
      setMarcando(null)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight first-letter:uppercase">{formatearMes(dia)}</h1>
        <div className="flex items-center gap-1">
          {claveDia(dia) !== claveDia(hoy) && (
            <button
              type="button"
              onClick={() => irA(hoy)}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-marca-700 hover:bg-marca-50"
            >
              Hoy
            </button>
          )}
          <BotonFlecha etiqueta="Semana anterior" onClick={() => irA(sumarDias(dia, -7))}>
            ‹
          </BotonFlecha>
          <BotonFlecha etiqueta="Semana siguiente" onClick={() => irA(sumarDias(dia, 7))}>
            ›
          </BotonFlecha>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {semana.map((d) => {
          const clave = claveDia(d)
          const seleccionado = clave === claveDia(dia)
          const esHoy = clave === claveDia(hoy)
          const cantidad = (porDia.get(clave) ?? []).filter((c) => c.estado !== 'CANCELADA').length
          return (
            <button
              key={clave}
              type="button"
              onClick={() => irA(d)}
              aria-pressed={seleccionado}
              aria-label={`${formatearDiaLargo(d)}${cantidad ? `, ${cantidad} citas` : ''}`}
              className={`flex min-h-18 flex-col items-center justify-center gap-0.5 rounded-2xl border text-center transition-colors ${
                seleccionado
                  ? 'border-marca-600 bg-marca-600 text-white shadow-sm'
                  : esHoy
                    ? 'border-marca-200 bg-marca-50 text-marca-800'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-marca-200'
              }`}
            >
              <span className={`text-[0.7rem] font-medium uppercase ${seleccionado ? 'text-white/80' : 'text-stone-500'}`}>
                {formatearDiaSemana(d)}
              </span>
              <span className="text-lg font-bold leading-none">{d.getDate()}</span>
              <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(cantidad, 3) }, (_, i) => (
                  <span key={i} className={`size-1.5 rounded-full ${seleccionado ? 'bg-white' : 'bg-marca-500'}`} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      {aviso && (
        <div role="status" className="mb-4 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
          {aviso}
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold first-letter:uppercase">{formatearDiaLargo(dia)}</h2>
        {activas.length > 0 && (
          <p className="text-sm text-stone-500">
            {activas.length} {activas.length === 1 ? 'cita' : 'citas'}
            {totalDia > 0 && <> · <span className="font-semibold text-stone-800">{formatearPrecio(totalDia)}</span></>}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 space-y-3">
          <AvisoError mensaje={error} />
          {citas === null && (
            <Boton
              variante="secundario"
              onClick={() => {
                setError(null)
                setIntento((n) => n + 1)
              }}
            >
              Reintentar
            </Boton>
          )}
        </div>
      )}

      {citas === null ? (
        !error && (
          <div className="flex justify-center py-16 text-marca-600">
            <Spinner className="size-8" />
            <span className="sr-only">Cargando agenda…</span>
          </div>
        )
      ) : delDia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold">Día libre</p>
          <p className="mt-1 text-stone-600">No hay citas agendadas para este día.</p>
          <Link
            to={`/agenda/nueva?fecha=${claveDia(dia)}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-marca-700 hover:bg-marca-50"
          >
            + Agendar una cita
          </Link>
        </div>
      ) : (
        <>
          {atendidas > 0 && (
            <p className="mb-3 text-sm text-stone-500">
              {atendidas} de {activas.length} {activas.length === 1 ? 'atendida' : 'atendidas'}
            </p>
          )}
          <ul className="space-y-2">
            {delDia.map((cita) => (
              <li
                key={cita.id}
                className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${cita.estado === 'CANCELADA' ? 'opacity-60' : ''}`}
              >
                <Link to={`/agenda/${cita.id}`} className="flex gap-4 p-4 pb-3">
                  <HoraCita inicio={cita.inicio} duracionMinutos={cita.duracionMinutos} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`truncate font-semibold ${cita.estado === 'CANCELADA' ? 'line-through' : ''}`}>
                        {cita.cliente.nombre}
                      </p>
                      <InsigniaEstado estado={cita.estado} />
                    </div>
                    <p className="truncate text-sm text-stone-600">{cita.servicio}</p>
                    {cita.precio !== null && (
                      <p className="text-sm font-semibold text-stone-800">{formatearPrecio(cita.precio)}</p>
                    )}
                  </div>
                </Link>
                {cita.estado === 'PROGRAMADA' && (
                  <div className="flex gap-2 border-t border-stone-100 px-4 py-2.5">
                    <EnlaceWhatsApp
                      href={enlaceWhatsApp(
                        cita.cliente.telefono,
                        mensajeRecordatorioCita(cita.cliente.nombre, salon?.nombre ?? 'nuestro negocio', cita.inicio),
                      )}
                    >
                      Recordar
                    </EnlaceWhatsApp>
                    <button
                      type="button"
                      onClick={() => marcar(cita, 'COMPLETADA')}
                      disabled={marcando === cita.id}
                      className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-marca-600 px-3.5 text-sm font-semibold text-white hover:bg-marca-700 disabled:opacity-60"
                    >
                      {marcando === cita.id ? <Spinner className="size-4" /> : <span aria-hidden="true">✓</span>}
                      Atendida
                    </button>
                    <button
                      type="button"
                      onClick={() => marcar(cita, 'NO_ASISTIO')}
                      disabled={marcando === cita.id}
                      className="inline-flex min-h-10 items-center rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
                    >
                      No vino
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <EnlaceFlotante to={`/agenda/nueva?fecha=${claveDia(dia)}`}>Nueva cita</EnlaceFlotante>
    </main>
  )
}

/** "9:00" grande y "a. m. · 1 h" pequeño debajo, para que la hora no se parta en dos líneas. */
function HoraCita({ inicio, duracionMinutos }: { inicio: string; duracionMinutos: number }) {
  const [hora, ...periodo] = formatearHora(inicio).split(/\s/)
  return (
    <div className="w-16 shrink-0">
      <p className="text-lg font-bold leading-tight text-stone-900">{hora}</p>
      <p className="text-xs text-stone-500">
        {periodo.join(' ')} · {formatearDuracion(duracionMinutos)}
      </p>
    </div>
  )
}

function BotonFlecha({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex size-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-2xl leading-none text-stone-700 hover:bg-stone-100"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}
