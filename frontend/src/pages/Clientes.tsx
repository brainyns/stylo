import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { listarClientes, type Cliente } from '../api/clientes'
import { EnlaceFlotante } from '../components/Layout'
import { AvatarCliente, AvisoError, Boton, Spinner, claseInput } from '../components/ui'
import { describirCuandoVuelve, diasDesdeHoy, formatearFechaCorta, formatearHora, formatearPrecio } from '../lib/formato'
import { formatearTelefono, normalizar } from '../lib/tonos'

const ORDENES = {
  nombre: { etiqueta: 'A–Z', comparar: (a: Cliente, b: Cliente) => a.nombre.localeCompare(b.nombre, 'es') },
  visitas: { etiqueta: 'Más visitas', comparar: (a: Cliente, b: Cliente) => b.visitas - a.visitas },
  gasto: { etiqueta: 'Más gasto', comparar: (a: Cliente, b: Cliente) => b.totalGastado - a.totalGastado },
  recientes: {
    etiqueta: 'Vinieron hace poco',
    comparar: (a: Cliente, b: Cliente) => (b.ultimaVisita ?? '').localeCompare(a.ultimaVisita ?? ''),
  },
} as const

type Orden = keyof typeof ORDENES

/** Busca por nombre (sin tildes), por parte del celular o por correo. */
function coincide(cliente: Cliente, texto: string, digitos: string): boolean {
  if (!texto) return true
  if (normalizar(cliente.nombre).includes(texto)) return true
  if (digitos.length >= 3 && cliente.telefono.includes(digitos)) return true
  return !!cliente.email && cliente.email.includes(texto)
}

export default function Clientes() {
  const location = useLocation()
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  const [params, setParams] = useSearchParams()
  const orden: Orden = (params.get('orden') as Orden) in ORDENES ? (params.get('orden') as Orden) : 'nombre'
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [intento, setIntento] = useState(0)
  const refBusqueda = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let activo = true
    listarClientes()
      .then((c) => activo && setClientes(c))
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [intento])

  // En computador, "/" lleva directo al buscador
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      const enCampo = e.target instanceof HTMLElement && e.target.closest('input, textarea, select')
      if (e.key === '/' && !enCampo) {
        e.preventDefault()
        refBusqueda.current?.focus()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda)
    const digitos = busqueda.replace(/\D/g, '')
    return (clientes ?? [])
      .filter((c) => coincide(c, texto, digitos))
      .sort((a, b) => ORDENES[orden].comparar(a, b) || ORDENES.nombre.comparar(a, b))
  }, [clientes, busqueda, orden])

  const totales = useMemo(
    () => ({
      visitas: (clientes ?? []).reduce((suma, c) => suma + c.visitas, 0),
      gastado: (clientes ?? []).reduce((suma, c) => suma + c.totalGastado, 0),
    }),
    [clientes],
  )

  function reintentar() {
    setError(null)
    setIntento((n) => n + 1)
  }

  function cambiarOrden(nuevo: Orden) {
    setParams(nuevo === 'nombre' ? {} : { orden: nuevo }, { replace: true })
  }

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h1 className="text-[1.75rem] leading-tight tracking-tight">Clientes</h1>
          {clientes && clientes.length > 0 && (
            <span className="text-right text-sm text-stone-500">
              {clientes.length} en total · {totales.visitas} visitas · {formatearPrecio(totales.gastado)}
            </span>
          )}
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
        ) : clientes === null ? (
          <div className="flex justify-center py-16 text-marca-600">
            <Spinner className="size-8" />
            <span className="sr-only">Cargando clientes…</span>
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold">Aún no tienes clientes.</p>
            <p className="mt-1 text-stone-600">Agrega el primero: solo necesitas el nombre y el WhatsApp.</p>
          </div>
        ) : (
          <>
            <div className="relative">
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
                ref={refBusqueda}
                type="search"
                enterKeyHint="search"
                placeholder="Buscar por nombre, celular o correo"
                aria-label="Buscar cliente por nombre, celular o correo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setBusqueda('')}
                className={`${claseInput} pl-12`}
              />
            </div>

            <div role="group" aria-label="Ordenar clientes" className="-mx-4 mb-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
              {(Object.keys(ORDENES) as Orden[]).map((clave) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => cambiarOrden(clave)}
                  aria-pressed={orden === clave}
                  className="min-h-9 shrink-0 rounded-full border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 aria-pressed:border-stone-900 aria-pressed:bg-stone-900 aria-pressed:text-white"
                >
                  {ORDENES[clave].etiqueta}
                </button>
              ))}
            </div>

            {filtrados.length === 0 ? (
              <p className="py-10 text-center text-stone-600">No hay clientes que coincidan con «{busqueda.trim()}».</p>
            ) : (
              <ul className="space-y-2">
                {filtrados.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/clientes/${c.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-marca-200 active:bg-stone-50"
                    >
                      <AvatarCliente nombre={c.nombre} tono={c.tono} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.nombre}</p>
                        <p className="truncate text-sm text-stone-500">{formatearTelefono(c.telefono)}</p>
                        <p className="mt-0.5 truncate text-sm text-stone-700">
                          {c.visitas === 0
                            ? 'Sin visitas aún'
                            : `${c.visitas} ${c.visitas === 1 ? 'visita' : 'visitas'} · ${formatearPrecio(c.totalGastado)}`}
                        </p>
                      </div>
                      <EstadoVisita cliente={c} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <EnlaceFlotante to="/clientes/nuevo">Agregar cliente</EnlaceFlotante>
    </>
  )
}

/** A la derecha de cada cliente: su próxima cita, o cuándo le toca volver, o cada cuánto vuelve. */
function EstadoVisita({ cliente }: { cliente: Cliente }) {
  let etiqueta = 'Vuelve cada'
  let valor = `${cliente.frecuenciaSemanas} sem`
  let color = 'text-marca-700'
  if (cliente.proximaCita) {
    etiqueta = `Cita · ${formatearFechaCorta(cliente.proximaCita)}`
    valor = formatearHora(cliente.proximaCita)
    color = 'text-sky-700'
  } else if (cliente.leTocaVolver) {
    const atrasado = diasDesdeHoy(cliente.leTocaVolver) < 0
    etiqueta = atrasado ? 'Atrasado' : 'Próxima visita'
    valor = atrasado ? describirCuandoVuelve(cliente.leTocaVolver).replace('Atrasado ', '') : formatearFechaCorta(cliente.leTocaVolver)
    color = atrasado ? 'text-amber-700' : 'text-marca-700'
  }
  return (
    <div className="shrink-0 text-right">
      <p className="text-xs text-stone-500 first-letter:uppercase">{etiqueta}</p>
      <p className={`text-sm font-semibold ${color}`}>{valor}</p>
    </div>
  )
}
