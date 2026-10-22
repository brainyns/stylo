import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { obtenerSalon, type Salon } from '../api/auth'
import { listarCitasDeCliente, type Cita } from '../api/citas'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  obtenerCliente,
  type Cliente,
  type ClienteRequest,
} from '../api/clientes'
import { EncabezadoVolver } from '../components/Layout'
import {
  AvatarCliente,
  AvisoError,
  Boton,
  Campo,
  EnlaceWhatsApp,
  InsigniaEstado,
  PantallaCargando,
  claseInput,
} from '../components/ui'
import { describirCuandoVuelve, diasDesdeHoy, formatearFechaCorta, formatearHora, formatearPrecio } from '../lib/formato'
import { enlaceWhatsApp, mensajeLeTocaVolver } from '../lib/whatsapp'
import { FRECUENCIAS_SEMANAS, TONOS, agruparTelefono, formatearTelefono, frecuenciaPorDefecto } from '../lib/tonos'

interface Formulario {
  nombre: string
  telefono: string
  email: string
  notas: string
  // "Más datos": cada cuánto vuelve y, fuera de barber, el color
  frecuenciaSemanas: number | null
  tono: string
  formula: string
}

const VACIO: Formulario = { nombre: '', telefono: '', email: '', notas: '', frecuenciaSemanas: null, tono: '', formula: '' }

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lo mismo que revisa el backend, para avisar al instante sin esperar la respuesta. */
function validar(datos: Formulario): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!datos.nombre.trim()) errores.nombre = 'Escribe el nombre.'
  const digitos = datos.telefono.replace(/\D/g, '').replace(/^57(?=\d{10}$)/, '')
  if (!digitos) errores.telefono = 'Escribe el WhatsApp.'
  else if (!/^3\d{9}$/.test(digitos)) errores.telefono = 'Debe ser un celular de 10 dígitos que empiece por 3, ej. 300 123 4567.'
  if (datos.email.trim() && !EMAIL_VALIDO.test(datos.email.trim()))
    errores.email = 'Revisa el correo, parece incompleto (ej. nombre@correo.com).'
  return errores
}

export default function ClienteForm() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()
  const refNombre = useRef<HTMLInputElement>(null)

  const [datos, setDatos] = useState<Formulario>(VACIO)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(editando)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'volver' | 'otro' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    let activo = true
    if (!id) {
      // Solo hace falta el tipo de negocio; si falla, el formulario sirve igual
      obtenerSalon()
        .then((s) => activo && setSalon(s))
        .catch(() => {})
      return () => {
        activo = false
      }
    }
    Promise.all([obtenerCliente(id), listarCitasDeCliente(id), obtenerSalon()])
      .then(([c, historial, s]) => {
        if (!activo) return
        setSalon(s)
        setCliente(c)
        setCitas(historial)
        setDatos({
          nombre: c.nombre,
          telefono: formatearTelefono(c.telefono),
          email: c.email ?? '',
          notas: c.notas ?? '',
          frecuenciaSemanas: c.frecuenciaSemanas,
          tono: c.tono ?? '',
          formula: c.formula ?? '',
        })
      })
      .catch((err: Error) => activo && setErrorCarga(err.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [id])

  const esBarber = salon?.tipo === 'BARBERIA'
  const frecuencia = datos.frecuenciaSemanas ?? frecuenciaPorDefecto(salon?.tipo)

  const cambiar =
    (campo: 'nombre' | 'email' | 'notas' | 'tono' | 'formula') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDatos((d) => ({ ...d, [campo]: e.target.value }))

  function mostrarErrores(campos: Record<string, string>) {
    setErrores(campos)
    const primero = ['nombre', 'telefono', 'email'].find((c) => campos[c])
    if (primero) document.getElementById(primero)?.focus()
  }

  // Lo llaman el submit del formulario y el botón "Guardar y agregar otro"
  async function guardar(e: Pick<FormEvent, 'preventDefault'>, despues: 'volver' | 'otro' = 'volver') {
    e.preventDefault()
    setError(null)
    setAviso(null)
    const invalidos = validar(datos)
    if (Object.keys(invalidos).length > 0) {
      mostrarErrores(invalidos)
      return
    }
    setErrores({})
    setEnviando(despues)
    const cuerpo: ClienteRequest = {
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      email: datos.email.trim() || null,
      // Se envían aunque estén ocultos para no borrar el color que ya tenía guardado
      tono: datos.tono || null,
      formula: datos.formula.trim() || null,
      frecuenciaSemanas: frecuencia,
      notas: datos.notas.trim() || null,
    }
    try {
      if (id) await actualizarCliente(id, cuerpo)
      else await crearCliente(cuerpo)
      if (despues === 'otro') {
        // Formulario limpio y el cursor en el nombre, listo para el siguiente
        setDatos(VACIO)
        setAviso(`Se guardó a ${cuerpo.nombre}. Agrega el siguiente.`)
        setEnviando(null)
        refNombre.current?.focus()
        return
      }
      navigate('/clientes', { state: { aviso: editando ? 'Cambios guardados.' : `Se guardó a ${cuerpo.nombre}.` } })
    } catch (err) {
      setEnviando(null)
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      if (err instanceof ApiError) mostrarErrores(err.errores)
    }
  }

  async function eliminar() {
    if (!id) return
    setEliminando(true)
    setError(null)
    try {
      await eliminarCliente(id)
      navigate('/clientes', { replace: true, state: { aviso: `Se eliminó a ${datos.nombre}.` } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      setEliminando(false)
      setConfirmandoEliminar(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (cargando) return <PantallaCargando />

  // Si el cliente ya tiene un valor que no está en las listas, se conserva como opción
  const tonos: string[] = datos.tono && !(TONOS as readonly string[]).includes(datos.tono) ? [...TONOS, datos.tono] : [...TONOS]
  const frecuencias: number[] = (FRECUENCIAS_SEMANAS as readonly number[]).includes(frecuencia)
    ? [...FRECUENCIAS_SEMANAS]
    : [...FRECUENCIAS_SEMANAS, frecuencia].sort((a, b) => a - b)

  // Error junto a cada campo
  const propsCampo = (campo: string) => ({
    'aria-invalid': !!errores[campo],
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  })

  const ocupado = enviando !== null || eliminando

  return (
    <div className="min-h-dvh pb-10">
      <EncabezadoVolver to="/clientes">Clientes</EncabezadoVolver>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        <div className="mb-6 flex items-center gap-4">
          {editando && <AvatarCliente nombre={datos.nombre} tono={datos.tono || null} className="size-14 text-xl" />}
          <h1 className="text-[1.75rem] leading-tight tracking-tight">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h1>
        </div>

        {errorCarga ? (
          <div className="space-y-3">
            <AvisoError mensaje={errorCarga} />
            <Link to="/clientes" className="block py-3 text-center font-semibold text-marca-700">
              Volver a la lista
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={guardar} className="space-y-5" noValidate>
              <AvisoError mensaje={error} />
              {aviso && (
                <div role="status" className="rounded-xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
                  {aviso}
                </div>
              )}

              <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
                <input
                  ref={refNombre}
                  id="nombre"
                  autoComplete="off"
                  autoCapitalize="words"
                  autoFocus={!editando}
                  enterKeyHint="next"
                  required
                  placeholder="Ej. Andrés Gómez"
                  value={datos.nombre}
                  onChange={cambiar('nombre')}
                  className={claseInput}
                  {...propsCampo('nombre')}
                />
              </Campo>

              <Campo id="telefono" etiqueta="WhatsApp" error={errores.telefono}>
                <input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  enterKeyHint={editando ? 'next' : 'done'}
                  required
                  placeholder="300 123 4567"
                  value={datos.telefono}
                  onChange={(e) => setDatos((d) => ({ ...d, telefono: agruparTelefono(e.target.value) }))}
                  className={claseInput}
                  {...propsCampo('telefono')}
                />
              </Campo>

              <Campo id="email" etiqueta="Correo" opcional error={errores.email}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nombre@correo.com"
                  value={datos.email}
                  onChange={cambiar('email')}
                  className={claseInput}
                  {...propsCampo('email')}
                />
              </Campo>

              <Campo id="notas" etiqueta="Notas" opcional error={errores.notas}>
                <textarea
                  id="notas"
                  rows={3}
                  placeholder={esBarber ? 'Ej. degradado bajo, barba en punta, máquina 2 a los lados.' : 'Ej. tipo de corte, alergias o preferencias.'}
                  value={datos.notas}
                  onChange={cambiar('notas')}
                  className={`${claseInput} py-3`}
                  {...propsCampo('notas')}
                />
              </Campo>

              <details
                className="group rounded-2xl border border-stone-200 bg-white"
                open={!!errores.frecuenciaSemanas || !!errores.tono || !!errores.formula || undefined}
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
                  <span>
                    Más datos
                    <span className="ml-2 font-normal text-stone-500">
                      Vuelve cada {frecuencia} {frecuencia === 1 ? 'semana' : 'semanas'}
                      {!esBarber && datos.tono && ` · ${datos.tono}`}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-stone-400 transition-transform group-open:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="space-y-5 border-t border-stone-100 px-4 pb-4 pt-4">
                  <Campo
                    id="frecuenciaSemanas"
                    etiqueta="Vuelve cada"
                    ayuda="Con esto Stylo te avisa en «Por volver» cuándo le toca."
                    error={errores.frecuenciaSemanas}
                  >
                    <select
                      id="frecuenciaSemanas"
                      value={frecuencia}
                      onChange={(e) => setDatos((d) => ({ ...d, frecuenciaSemanas: Number(e.target.value) }))}
                      className={claseInput}
                      {...propsCampo('frecuenciaSemanas')}
                    >
                      {frecuencias.map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'semana' : 'semanas'}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  {/* El color solo aplica fuera de barber; mientras no se sabe el tipo, no se muestra */}
                  {salon && !esBarber && (
                    <>
                      <Campo id="tono" etiqueta="Tono de color" opcional error={errores.tono}>
                        <select id="tono" value={datos.tono} onChange={cambiar('tono')} className={claseInput} {...propsCampo('tono')}>
                          <option value="">Sin tono</option>
                          {tonos.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Campo>
                      <Campo id="formula" etiqueta="Fórmula del color" opcional error={errores.formula}>
                        <input
                          id="formula"
                          autoComplete="off"
                          placeholder="Ej. 6.1 + 7.0, oxidante 20 vol."
                          value={datos.formula}
                          onChange={cambiar('formula')}
                          className={claseInput}
                          {...propsCampo('formula')}
                        />
                      </Campo>
                    </>
                  )}
                </div>
              </details>

              <div className="space-y-3 pt-1">
                <Boton type="submit" cargando={enviando === 'volver'} disabled={ocupado}>
                  {editando ? 'Guardar cambios' : 'Guardar cliente'}
                </Boton>
                {!editando && (
                  <Boton
                    type="button"
                    variante="secundario"
                    cargando={enviando === 'otro'}
                    disabled={ocupado}
                    onClick={(e) => guardar(e, 'otro')}
                  >
                    Guardar y agregar otro
                  </Boton>
                )}
                <Link
                  to="/clientes"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </Link>
              </div>
            </form>

            {cliente && <Visitas cliente={cliente} citas={citas} negocio={salon?.nombre ?? ''} />}

            {editando && (
              <section className="mt-8 border-t border-stone-200 pt-6">
                {confirmandoEliminar ? (
                  <div role="alertdialog" aria-labelledby="titulo-eliminar" className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p id="titulo-eliminar" className="font-semibold text-red-900">
                      ¿Eliminar a {datos.nombre}?
                    </p>
                    <p className="mt-1 text-sm text-red-800">Se borrarán sus datos y su historial de citas. Esta acción no se puede deshacer.</p>
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
                  <Boton variante="peligroSuave" onClick={() => setConfirmandoEliminar(true)} disabled={ocupado}>
                    Eliminar cliente
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

/** Próxima cita, cuándo le toca volver e historial de citas del cliente. */
function Visitas({ cliente, citas, negocio }: { cliente: Cliente; citas: Cita[]; negocio: string }) {
  const atrasado = cliente.leTocaVolver !== null && diasDesdeHoy(cliente.leTocaVolver) < 0
  return (
    <section className="mt-8 border-t border-stone-200 pt-6">
      <h2 className="text-lg font-bold tracking-tight">Visitas</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-500">Próxima cita</p>
          <p className="mt-0.5 font-semibold first-letter:uppercase">
            {cliente.proximaCita
              ? `${formatearFechaCorta(cliente.proximaCita)}, ${formatearHora(cliente.proximaCita)}`
              : 'Sin agendar'}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 ${atrasado ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}
        >
          <p className="text-xs text-stone-500">Le toca volver</p>
          <p className={`mt-0.5 font-semibold first-letter:uppercase ${atrasado ? 'text-amber-800' : ''}`}>
            {cliente.leTocaVolver
              ? cliente.proximaCita
                ? formatearFechaCorta(cliente.leTocaVolver)
                : describirCuandoVuelve(cliente.leTocaVolver).replace(/^Le toca /, '')
              : 'Sin visitas aún'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <EnlaceWhatsApp
          href={enlaceWhatsApp(cliente.telefono, mensajeLeTocaVolver(cliente.nombre, negocio))}
          className="flex-1 justify-center"
        >
          Escribirle
        </EnlaceWhatsApp>
        <Link
          to={`/agenda/nueva?clienteId=${cliente.id}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-marca-600 px-3.5 text-sm font-semibold text-white hover:bg-marca-700"
        >
          Agendar cita
        </Link>
      </div>

      {citas.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {citas.slice(0, 10).map((cita) => (
            <li key={cita.id}>
              <Link to={`/agenda/${cita.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{cita.servicio}</p>
                  <p className="text-sm text-stone-500 first-letter:uppercase">
                    {formatearFechaCorta(cita.inicio)}, {formatearHora(cita.inicio)}
                    {cita.precio !== null && ` · ${formatearPrecio(cita.precio)}`}
                  </p>
                </div>
                <InsigniaEstado estado={cita.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
