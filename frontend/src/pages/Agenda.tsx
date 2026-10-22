import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { listarCitas, type Cita } from '../api/citas'
import { CalendarioCitas } from '../components/CalendarioCitas'
import { DetalleCita } from '../components/DetalleCita'
import { EnlaceFlotante } from '../components/Layout'
import { AvisoError, Boton, Spinner } from '../components/ui'
import {
  claveDia,
  desdeClave,
  formatearDiaLargo,
  formatearDiaSemana,
  formatearMes,
  formatearPrecio,
  inicioDeSemana,
  inicioDelDia,
  sumarDias,
} from '../lib/formato'
import { useNegocio } from '../lib/negocio'

type Vista = 'dia' | 'semana'

/** Sin elegir: semana en computador, día en el celular. */
const vistaPorDefecto = (): Vista => (window.matchMedia('(min-width: 1024px)').matches ? 'semana' : 'dia')

export default function Agenda() {
  const { salon } = useNegocio()
  const navigate = useNavigate()
  const location = useLocation()
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  const [params, setParams] = useSearchParams()
  const [hoy] = useState(() => inicioDelDia(new Date()))
  const [vistaInicial] = useState(vistaPorDefecto)
  const vista: Vista = params.get('vista') === 'semana' || params.get('vista') === 'dia' ? (params.get('vista') as Vista) : vistaInicial
  const dia = desdeClave(params.get('fecha')) ?? hoy
  const lunes = inicioDeSemana(dia)
  const claveLunes = claveDia(lunes)

  // Citas de la semana cargada; mientras llega otra semana, citas queda en null
  const [cargadas, setCargadas] = useState<{ semana: string; citas: Cita[] } | null>(null)
  const citas = cargadas?.semana === claveLunes ? cargadas.citas : null
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [abierta, setAbierta] = useState<Cita | null>(null)

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
  // Las canceladas no ocupan espacio en el calendario; se cuentan aparte
  const { porDia, canceladas } = useMemo(() => {
    const mapa = new Map<string, Cita[]>()
    const sinHueco = new Map<string, number>()
    for (const cita of citas ?? []) {
      const clave = claveDia(new Date(cita.inicio))
      if (cita.estado === 'CANCELADA') sinHueco.set(clave, (sinHueco.get(clave) ?? 0) + 1)
      else mapa.set(clave, [...(mapa.get(clave) ?? []), cita])
    }
    return { porDia: mapa, canceladas: sinHueco }
  }, [citas])

  const visibles = vista === 'dia' ? [dia] : semana
  const delPeriodo = visibles.flatMap((d) => porDia.get(claveDia(d)) ?? [])
  const totalPeriodo = delPeriodo.reduce((suma, c) => suma + (c.precio ?? 0), 0)
  const atendidas = delPeriodo.filter((c) => c.estado === 'COMPLETADA').length
  const canceladasPeriodo = visibles.reduce((suma, d) => suma + (canceladas.get(claveDia(d)) ?? 0), 0)

  function ir(cambios: { fecha?: Date; vista?: Vista }) {
    setError(null)
    setParams(
      { fecha: claveDia(cambios.fecha ?? dia), vista: cambios.vista ?? vista },
      { replace: true, state: null },
    )
  }

  const paso = vista === 'dia' ? 1 : 7
  const enHoy = vista === 'dia' ? claveDia(dia) === claveDia(hoy) : claveLunes === claveDia(inicioDeSemana(hoy))

  function alCambiar(actualizada: Cita) {
    setAbierta(null)
    setCargadas((actual) =>
      actual && { ...actual, citas: actual.citas.map((c) => (c.id === actualizada.id ? actualizada : c)) },
    )
    // Si la cita se movió a otra semana, se recarga para que salga de esta
    if (inicioDeSemana(new Date(actualizada.inicio)).getTime() !== lunes.getTime()) setIntento((n) => n + 1)
  }

  return (
    <main className={`mx-auto px-4 pt-6 ${vista === 'semana' ? 'max-w-2xl lg:max-w-6xl lg:px-8' : 'max-w-2xl'} lg:pt-10`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight tracking-tight first-letter:uppercase">{formatearMes(dia)}</h1>
        <div className="flex items-center gap-1.5">
          <div role="group" aria-label="Vista" className="mr-1 flex rounded-xl border border-stone-200 bg-white p-1">
            {(['dia', 'semana'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => ir({ vista: v })}
                aria-pressed={vista === v}
                className="min-h-9 rounded-lg px-3 text-sm font-semibold text-stone-600 hover:text-stone-900 aria-pressed:bg-stone-950 aria-pressed:text-white"
              >
                {v === 'dia' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>
          {!enHoy && (
            <button
              type="button"
              onClick={() => ir({ fecha: hoy })}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-marca-700 hover:bg-marca-50"
            >
              Hoy
            </button>
          )}
          <BotonFlecha etiqueta={vista === 'dia' ? 'Día anterior' : 'Semana anterior'} onClick={() => ir({ fecha: sumarDias(dia, -paso) })}>
            ‹
          </BotonFlecha>
          <BotonFlecha etiqueta={vista === 'dia' ? 'Día siguiente' : 'Semana siguiente'} onClick={() => ir({ fecha: sumarDias(dia, paso) })}>
            ›
          </BotonFlecha>
        </div>
      </div>

      {vista === 'dia' && (
        <div className="mb-5 grid grid-cols-7 gap-1.5">
          {semana.map((d) => {
            const clave = claveDia(d)
            const seleccionado = clave === claveDia(dia)
            const esHoy = clave === claveDia(hoy)
            const cantidad = porDia.get(clave)?.length ?? 0
            return (
              <button
                key={clave}
                type="button"
                onClick={() => ir({ fecha: d })}
                aria-pressed={seleccionado}
                aria-label={`${formatearDiaLargo(d)}${cantidad ? `, ${cantidad} citas` : ''}`}
                className={`flex min-h-18 flex-col items-center justify-center gap-0.5 rounded-2xl border text-center transition-colors ${
                  seleccionado
                    ? 'border-stone-950 bg-stone-950 text-white shadow-sm'
                    : esHoy
                      ? 'border-marca-200 bg-marca-50 text-marca-800'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-marca-200'
                }`}
              >
                <span className={`text-[0.7rem] font-medium uppercase ${seleccionado ? 'text-white/70' : 'text-stone-500'}`}>
                  {formatearDiaSemana(d)}
                </span>
                <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                  {Array.from({ length: Math.min(cantidad, 3) }, (_, i) => (
                    <span key={i} className={`size-1.5 rounded-full ${seleccionado ? 'bg-marca-300' : 'bg-marca-500'}`} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {aviso && (
        <div role="status" className="mb-4 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
          {aviso}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-semibold first-letter:uppercase">
          {vista === 'dia' ? formatearDiaLargo(dia) : `Semana del ${lunes.getDate()} al ${formatearDiaLargo(sumarDias(lunes, 6)).replace(/^\S+\s/, '')}`}
        </h2>
        {citas !== null && (
          <p className="text-sm text-stone-500">
            {delPeriodo.length === 0 ? 'Sin citas' : `${delPeriodo.length} ${delPeriodo.length === 1 ? 'cita' : 'citas'}`}
            {atendidas > 0 && ` · ${atendidas} atendidas`}
            {totalPeriodo > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-stone-800">{formatearPrecio(totalPeriodo)}</span>
              </>
            )}
            {canceladasPeriodo > 0 && ` · ${canceladasPeriodo} canceladas`}
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
      ) : (
        <>
          <p className="mb-2 text-xs text-stone-500">Toca una cita para cambiar la hora o el servicio, o un espacio libre para agendar.</p>
          <CalendarioCitas
            dias={visibles}
            citasPorDia={porDia}
            onAbrir={setAbierta}
            onNueva={(d, hora) => navigate(`/agenda/nueva?fecha=${claveDia(d)}&hora=${hora}`)}
            onElegirDia={(d) => ir({ fecha: d, vista: 'dia' })}
          />
        </>
      )}

      {abierta && (
        <DetalleCita
          key={abierta.id}
          cita={abierta}
          tipo={salon?.tipo ?? 'MIXTO'}
          negocio={salon?.nombre ?? 'nuestro negocio'}
          onCerrar={() => setAbierta(null)}
          onCambio={alCambiar}
        />
      )}

      <EnlaceFlotante to={`/agenda/nueva?fecha=${claveDia(dia)}`}>Nueva cita</EnlaceFlotante>
    </main>
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
