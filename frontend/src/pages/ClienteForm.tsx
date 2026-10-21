import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { actualizarCliente, crearCliente, eliminarCliente, obtenerCliente, type ClienteRequest } from '../api/clientes'
import { AvisoError, Boton, Campo, CirculoTono, PantallaCargando, claseInput } from '../components/ui'
import { FRECUENCIAS_SEMANAS, FRECUENCIA_POR_DEFECTO, TONOS, formatearTelefono } from '../lib/tonos'

interface Formulario {
  nombre: string
  telefono: string
  tono: string
  formula: string
  frecuenciaSemanas: number
  notas: string
}

const VACIO: Formulario = {
  nombre: '',
  telefono: '',
  tono: '',
  formula: '',
  frecuenciaSemanas: FRECUENCIA_POR_DEFECTO,
  notas: '',
}

export default function ClienteForm() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()

  const [datos, setDatos] = useState<Formulario>(VACIO)
  const [cargando, setCargando] = useState(editando)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (!id) return
    let activo = true
    obtenerCliente(id)
      .then((c) => {
        if (!activo) return
        setDatos({
          nombre: c.nombre,
          telefono: formatearTelefono(c.telefono),
          tono: c.tono ?? '',
          formula: c.formula ?? '',
          frecuenciaSemanas: c.frecuenciaSemanas,
          notas: c.notas ?? '',
        })
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
      setDatos((d) => ({ ...d, [campo]: campo === 'frecuenciaSemanas' ? Number(e.target.value) : e.target.value }))

  function mostrarError(err: unknown) {
    setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    setErrores(err instanceof ApiError ? err.errores : {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setErrores({})
    const cuerpo: ClienteRequest = {
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      tono: datos.tono || null,
      formula: datos.formula.trim() || null,
      frecuenciaSemanas: datos.frecuenciaSemanas,
      notas: datos.notas.trim() || null,
    }
    try {
      if (id) await actualizarCliente(id, cuerpo)
      else await crearCliente(cuerpo)
      navigate('/clientes', { state: { aviso: editando ? 'Cambios guardados.' : `Se guardó a ${cuerpo.nombre}.` } })
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
      await eliminarCliente(id)
      navigate('/clientes', { replace: true, state: { aviso: `Se eliminó a ${datos.nombre}.` } })
    } catch (err) {
      mostrarError(err)
      setEliminando(false)
      setConfirmandoEliminar(false)
    }
  }

  if (cargando) return <PantallaCargando />

  // Si el cliente ya tiene un valor que no está en las listas, se conserva como opción
  const tonos: string[] = datos.tono && !(TONOS as readonly string[]).includes(datos.tono) ? [...TONOS, datos.tono] : [...TONOS]
  const frecuencias: number[] = (FRECUENCIAS_SEMANAS as readonly number[]).includes(datos.frecuenciaSemanas)
    ? [...FRECUENCIAS_SEMANAS]
    : [...FRECUENCIAS_SEMANAS, datos.frecuenciaSemanas].sort((a, b) => a - b)

  // Error del backend junto a cada campo
  const propsCampo = (campo: string) => ({
    'aria-invalid': !!errores[campo],
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  })

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-2 py-2">
          <Link
            to="/clientes"
            className="flex min-h-11 items-center gap-1 rounded-xl px-3 font-semibold text-marca-700 hover:bg-stone-100 active:bg-stone-200"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
            Clientes
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-6 flex items-center gap-4">
          <CirculoTono tono={datos.tono || null} className="size-14" />
          <h1 className="text-2xl font-bold tracking-tight">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h1>
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

              <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
                <input
                  id="nombre"
                  autoComplete="off"
                  autoCapitalize="words"
                  required
                  value={datos.nombre}
                  onChange={cambiar('nombre')}
                  className={claseInput}
                  {...propsCampo('nombre')}
                />
              </Campo>

              <Campo id="telefono" etiqueta="WhatsApp" ayuda="Celular de 10 dígitos, ej. 300 123 4567." error={errores.telefono}>
                <input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  required
                  value={datos.telefono}
                  onChange={cambiar('telefono')}
                  className={claseInput}
                  {...propsCampo('telefono')}
                />
              </Campo>

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

              <Campo id="frecuenciaSemanas" etiqueta="Vuelve cada" error={errores.frecuenciaSemanas}>
                <select
                  id="frecuenciaSemanas"
                  value={datos.frecuenciaSemanas}
                  onChange={cambiar('frecuenciaSemanas')}
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

              <Campo id="notas" etiqueta="Notas" opcional error={errores.notas}>
                <textarea
                  id="notas"
                  rows={4}
                  placeholder="Ej. tipo de corte, estilo de barba, alergias o preferencias."
                  value={datos.notas}
                  onChange={cambiar('notas')}
                  className={`${claseInput} py-3`}
                  {...propsCampo('notas')}
                />
              </Campo>

              <div className="space-y-3 pt-2">
                <Boton type="submit" cargando={enviando} disabled={eliminando}>
                  {editando ? 'Guardar cambios' : 'Guardar cliente'}
                </Boton>
                <Link
                  to="/clientes"
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
                      ¿Eliminar a {datos.nombre}?
                    </p>
                    <p className="mt-1 text-sm text-red-800">Se borrarán sus datos y su fórmula. Esta acción no se puede deshacer.</p>
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
