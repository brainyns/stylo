import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { obtenerSalon, type Salon } from '../api/auth'
import { listarClientas, type Clienta } from '../api/clientas'
import { AvisoError, Boton, CirculoTono, Spinner, claseInput } from '../components/ui'
import { borrarSesion } from '../lib/sesion'
import { formatearTelefono, normalizar } from '../lib/tonos'

export default function Clientas() {
  const navigate = useNavigate()
  const location = useLocation()
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  const [salon, setSalon] = useState<Salon | null>(null)
  const [clientas, setClientas] = useState<Clienta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    Promise.all([obtenerSalon(), listarClientas()])
      .then(([s, c]) => {
        if (!activo) return
        setSalon(s)
        setClientas([...c].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
      })
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [intento])

  const filtradas = useMemo(() => {
    const texto = normalizar(busqueda)
    return (clientas ?? []).filter((c) => normalizar(c.nombre).includes(texto))
  }, [clientas, busqueda])

  function reintentar() {
    setError(null)
    setIntento((n) => n + 1)
  }

  function cerrarSesion() {
    borrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-marca-600">Stylo</p>
            <p className="truncate text-lg font-bold">{salon?.nombre ?? ' '}</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Clientas</h1>
          {clientas && clientas.length > 0 && <span className="text-sm text-stone-500">{clientas.length} en total</span>}
        </div>

        {aviso && (
          <div role="status" className="mb-4 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
            {aviso}
          </div>
        )}

        {error ? (
          <div className="space-y-3">
            <AvisoError mensaje={error} />
            <Boton variante="secundario" onClick={reintentar}>
              Reintentar
            </Boton>
          </div>
        ) : clientas === null ? (
          <div className="flex justify-center py-16 text-marca-600">
            <Spinner className="size-8" />
            <span className="sr-only">Cargando clientas…</span>
          </div>
        ) : clientas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold">Aún no tienes clientas.</p>
            <p className="mt-1 text-stone-600">Agrega la primera.</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                placeholder="Buscar por nombre"
                aria-label="Buscar clienta por nombre"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`${claseInput} pl-12`}
              />
            </div>

            {filtradas.length === 0 ? (
              <p className="py-10 text-center text-stone-600">No hay clientas que coincidan con «{busqueda.trim()}».</p>
            ) : (
              <ul className="space-y-2">
                {filtradas.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/clientas/${c.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-marca-200 active:bg-stone-50"
                    >
                      <CirculoTono tono={c.tono} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.nombre}</p>
                        <p className="truncate text-sm text-stone-500">
                          {c.tono ?? 'Sin tono'} · {formatearTelefono(c.telefono)}
                        </p>
                        {c.formula && <p className="mt-0.5 truncate text-sm text-stone-700">{c.formula}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-stone-500">Retoca cada</p>
                        <p className="text-sm font-semibold text-marca-700">{c.frecuenciaSemanas} sem</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/clientas/nueva"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-marca-600 px-5 text-base font-semibold text-white shadow-sm hover:bg-marca-700 active:bg-marca-800"
          >
            <span className="text-xl leading-none" aria-hidden="true">
              +
            </span>
            Agregar clienta
          </Link>
        </div>
      </div>
    </div>
  )
}
