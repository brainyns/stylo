import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { obtenerSalon, type TipoNegocio } from '../api/auth'
import { ApiError } from '../api/client'
import {
  NOMBRE_ESTADO,
  actualizarCita,
  crearCita,
  eliminarCita,
  obtenerCita,
  type CitaRequest,
  type EstadoCita,
} from '../api/citas'
import { listarClientes, type Cliente } from '../api/clientes'
import { AvisoError, Boton, Campo, PantallaCargando, claseInput } from '../components/ui'
import { claveDia, claveHora, desdeClave, formatearPrecio } from '../lib/formato'
import { DURACIONES_MINUTOS, DURACION_POR_DEFECTO, SERVICIOS_SUGERIDOS, formatearDuracion } from '../lib/servicios'

interface Formulario {
  clienteId: string
  fecha: string
  hora: string
  duracionMinutos: number
  servicio: string
  precio: string
  estado: EstadoCita
  notas: string
}

/** Próxima hora en punto, para que "nueva cita" arranque en un horario razonable. */
function horaSugerida(): string {
  const ahora = new Date()
  const hora = Math.min(Math.max(ahora.getHours() + 1, 8), 19)
  return `${String(hora).padStart(2, '0')}:00`
}

export default function CitaForm() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [datos, setDatos] = useState<Formulario>(() => ({
    clienteId: params.get('clienteId') ?? '',
    fecha: desdeClave(params.get('fecha')) ? params.get('fecha')! : claveDia(new Date()),
    hora: horaSugerida(),
    duracionMinutos: DURACION_POR_DEFECTO,
    servicio: '',
    precio: '',
    estado: 'PROGRAMADA',
    notas: '',
  }))
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tipo, setTipo] = useState<TipoNegocio>('MIXTO')
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([listarClientes(), obtenerSalon(), id ? obtenerCita(id) : Promise.resolve(null)])
      .then(([c, salon, cita]) => {
        if (!activo) return
        setClientes([...c].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
        setTipo(salon.tipo)
        if (cita) {
          const inicio = new Date(cita.inicio)
          setDatos({
            clienteId: cita.cliente.id,
            fecha: claveDia(inicio),
            hora: claveHora(inicio),
            duracionMinutos: cita.duracionMinutos,
            servicio: cita.servicio,
            precio: cita.precio !== null ? String(cita.precio) : '',
            estado: cita.estado,
            notas: cita.notas ?? '',
          })
        }
      })
      .catch((err: Error) => activo && setErrorCarga(err.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [id])

  const cambiar =
    (campo: keyof Formulario) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDatos((d) => ({ ...d, [campo]: campo === 'duracionMinutos' ? Number(e.target.value) : e.target.value }))

  const volverA = `/agenda?fecha=${datos.fecha}`

  function mostrarError(err: unknown) {
    setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    setErrores(err instanceof ApiError ? err.errores : {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setErrores({})
    const inicio = new Date(`${datos.fecha}T${datos.hora}`)
    if (Number.isNaN(inicio.getTime())) {
      setErrores({ inicio: 'Elige la fecha y la hora' })
      return
    }
    const precio = datos.precio.replace(/\D/g, '')
    const cuerpo: CitaRequest = {
      clienteId: datos.clienteId,
      inicio: inicio.toISOString(),
      duracionMinutos: datos.duracionMinutos,
      servicio: datos.servicio.trim(),
      precio: precio ? Number(precio) : null,
      estado: datos.estado,
      notas: datos.notas.trim() || null,
    }
    setEnviando(true)
    try {
      if (id) await actualizarCita(id, cuerpo)
      else await crearCita(cuerpo)
      navigate(volverA, { state: { aviso: editando ? 'Cambios guardados.' : 'Cita agendada.' } })
    } catch (err) {
      mostrarError(err)
      setEnviando(false)
    }
  }

  async function eliminar() {
    if (!id) return
    setEliminando(true)
    setError(null)
    try {
      await eliminarCita(id)
      navigate(volverA, { replace: true, state: { aviso: 'Cita eliminada.' } })
    } catch (err) {
      mostrarError(err)
      setEliminando(false)
      setConfirmandoEliminar(false)
    }
  }

  if (cargando) return <PantallaCargando />

  const propsCampo = (campo: string) => ({
    'aria-invalid': !!errores[campo],
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  })
  const precioNumero = Number(datos.precio.replace(/\D/g, ''))

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-2 py-2">
          <Link
            to={volverA}
            className="flex min-h-11 items-center gap-1 rounded-xl px-3 font-semibold text-marca-700 hover:bg-stone-100 active:bg-stone-200"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
            Agenda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{editando ? 'Editar cita' : 'Nueva cita'}</h1>

        {errorCarga ? (
          <div className="space-y-3">
            <AvisoError mensaje={errorCarga} />
            <Link to="/agenda" className="block py-3 text-center font-semibold text-marca-700">
              Volver a la agenda
            </Link>
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
            <p className="text-lg font-semibold">Primero agrega un cliente</p>
            <p className="mt-1 text-stone-600">Las citas se agendan a los clientes que tienes registrados.</p>
            <Link
              to="/clientes/nuevo"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-marca-700 hover:bg-marca-50"
            >
              + Agregar cliente
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={guardar} className="space-y-5" noValidate>
              <AvisoError mensaje={error} />

              <Campo id="clienteId" etiqueta="Cliente" error={errores.clienteId}>
                <select
                  id="clienteId"
                  value={datos.clienteId}
                  onChange={cambiar('clienteId')}
                  className={claseInput}
                  {...propsCampo('clienteId')}
                >
                  <option value="">Elige un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo id="fecha" etiqueta="Fecha" error={errores.inicio}>
                  <input
                    id="fecha"
                    type="date"
                    required
                    value={datos.fecha}
                    onChange={cambiar('fecha')}
                    className={claseInput}
                    aria-invalid={!!errores.inicio}
                    aria-describedby={errores.inicio ? 'fecha-error' : undefined}
                  />
                </Campo>
                <Campo id="hora" etiqueta="Hora">
                  <input
                    id="hora"
                    type="time"
                    step={900}
                    required
                    value={datos.hora}
                    onChange={cambiar('hora')}
                    className={claseInput}
                  />
                </Campo>
              </div>

              <Campo id="servicio" etiqueta="Servicio" error={errores.servicio}>
                <input
                  id="servicio"
                  autoComplete="off"
                  placeholder="Ej. Corte"
                  value={datos.servicio}
                  onChange={cambiar('servicio')}
                  className={claseInput}
                  {...propsCampo('servicio')}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {SERVICIOS_SUGERIDOS[tipo].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDatos((d) => ({ ...d, servicio: s }))}
                      aria-pressed={datos.servicio === s}
                      className="min-h-9 rounded-full border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-100 aria-pressed:border-marca-600 aria-pressed:bg-marca-50 aria-pressed:text-marca-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo id="duracionMinutos" etiqueta="Duración" error={errores.duracionMinutos}>
                  <select
                    id="duracionMinutos"
                    value={datos.duracionMinutos}
                    onChange={cambiar('duracionMinutos')}
                    className={claseInput}
                    {...propsCampo('duracionMinutos')}
                  >
                    {[...new Set([...DURACIONES_MINUTOS, datos.duracionMinutos])]
                      .sort((a, b) => a - b)
                      .map((m) => (
                        <option key={m} value={m}>
                          {formatearDuracion(m)}
                        </option>
                      ))}
                  </select>
                </Campo>
                <Campo
                  id="precio"
                  etiqueta="Precio"
                  opcional
                  error={errores.precio}
                  ayuda={precioNumero > 0 ? formatearPrecio(precioNumero) : undefined}
                >
                  <input
                    id="precio"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="25000"
                    value={datos.precio}
                    onChange={cambiar('precio')}
                    className={claseInput}
                    {...propsCampo('precio')}
                  />
                </Campo>
              </div>

              {editando && (
                <Campo id="estado" etiqueta="Estado" error={errores.estado}>
                  <select id="estado" value={datos.estado} onChange={cambiar('estado')} className={claseInput}>
                    {(Object.keys(NOMBRE_ESTADO) as EstadoCita[]).map((e) => (
                      <option key={e} value={e}>
                        {NOMBRE_ESTADO[e]}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}

              <Campo id="notas" etiqueta="Notas" opcional error={errores.notas}>
                <textarea
                  id="notas"
                  rows={3}
                  value={datos.notas}
                  onChange={cambiar('notas')}
                  className={`${claseInput} py-3`}
                  {...propsCampo('notas')}
                />
              </Campo>

              <div className="space-y-3 pt-2">
                <Boton type="submit" cargando={enviando} disabled={eliminando}>
                  {editando ? 'Guardar cambios' : 'Agendar cita'}
                </Boton>
                <Link
                  to={volverA}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </Link>
              </div>
            </form>

            {editando && (
              <section className="mt-8 border-t border-stone-200 pt-6">
                {confirmandoEliminar ? (
                  <div role="alertdialog" aria-labelledby="titulo-eliminar" className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p id="titulo-eliminar" className="font-semibold text-red-900">
                      ¿Eliminar esta cita?
                    </p>
                    <p className="mt-1 text-sm text-red-800">
                      Si el cliente solo no vino o canceló, mejor cambia el estado: así queda en su historial.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Boton variante="secundario" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando} autoFocus>
                        Cancelar
                      </Boton>
                      <Boton variante="peligro" onClick={eliminar} cargando={eliminando}>
                        Sí, eliminar
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <Boton variante="peligroSuave" onClick={() => setConfirmandoEliminar(true)} disabled={enviando}>
                    Eliminar cita
                  </Boton>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
