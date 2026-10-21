import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listarClientes, type Cliente } from '../api/clientes'
import { AvisoError, Boton, EnlaceWhatsApp, Spinner } from '../components/ui'
import { describirCuandoVuelve, diasDesdeHoy, formatearFechaCorta } from '../lib/formato'
import { useNegocio } from '../lib/negocio'
import { enlaceWhatsApp, mensajeLeTocaVolver } from '../lib/whatsapp'

/** Se muestran los que ya debían volver y los que les toca en esta ventana de días. */
const DIAS_DE_ANTICIPACION = 7

type ConFecha = Cliente & { leTocaVolver: string }

export default function PorVolver() {
  const { salon } = useNegocio()
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarClientes()
      .then((c) => activo && setClientes(c))
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [intento])

  // Quien ya tiene una cita programada no necesita que le escriban
  const pendientes = (clientes ?? [])
    .filter((c): c is ConFecha => c.leTocaVolver !== null && c.proximaCita === null)
    .filter((c) => diasDesdeHoy(c.leTocaVolver) <= DIAS_DE_ANTICIPACION)
    .sort((a, b) => a.leTocaVolver.localeCompare(b.leTocaVolver))
  const atrasados = pendientes.filter((c) => diasDesdeHoy(c.leTocaVolver) < 0)
  const pronto = pendientes.filter((c) => diasDesdeHoy(c.leTocaVolver) >= 0)
  const sinVisitas = (clientes ?? []).filter((c) => c.ultimaVisita === null && c.proximaCita === null).length

  return (
    <main className="mx-auto max-w-2xl px-4 pt-5">
      <h1 className="text-2xl font-bold tracking-tight">Por volver</h1>
      <p className="mt-1 text-stone-600">Clientes a los que ya les toca su próxima visita y aún no tienen cita.</p>

      {error ? (
        <div className="mt-5 space-y-3">
          <AvisoError mensaje={error} />
          <Boton
            variante="secundario"
            onClick={() => {
              setError(null)
              setIntento((n) => n + 1)
            }}
          >
            Reintentar
          </Boton>
        </div>
      ) : clientes === null ? (
        <div className="flex justify-center py-16 text-marca-600">
          <Spinner className="size-8" />
          <span className="sr-only">Cargando…</span>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Resumen valor={atrasados.length} etiqueta={atrasados.length === 1 ? 'atrasado' : 'atrasados'} alerta />
            <Resumen valor={pronto.length} etiqueta="esta semana" />
          </div>

          {pendientes.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
              <p className="text-lg font-semibold">¡Todo al día!</p>
              <p className="mt-1 text-stone-600">Nadie está atrasado ni le toca volver esta semana.</p>
            </div>
          ) : (
            <>
              <Grupo titulo="Ya debían volver" clientes={atrasados} negocio={salon?.nombre} />
              <Grupo titulo="Les toca esta semana" clientes={pronto} negocio={salon?.nombre} />
            </>
          )}

          {sinVisitas > 0 && (
            <p className="mt-6 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
              {sinVisitas} {sinVisitas === 1 ? 'cliente aún no tiene' : 'clientes aún no tienen'} visitas registradas.
              Cuando marques una cita como <span className="font-semibold">Atendida</span>, Stylo calcula solo cuándo le
              toca volver.
            </p>
          )}
        </>
      )}
    </main>
  )
}

function Resumen({ valor, etiqueta, alerta = false }: { valor: number; etiqueta: string; alerta?: boolean }) {
  const resaltado = alerta && valor > 0
  return (
    <div
      className={`rounded-2xl border p-4 ${resaltado ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-stone-200 bg-white'}`}
    >
      <p className="text-3xl font-bold leading-none">{valor}</p>
      <p className={`mt-1 text-sm ${resaltado ? 'text-amber-800' : 'text-stone-500'}`}>{etiqueta}</p>
    </div>
  )
}

function Grupo({ titulo, clientes, negocio }: { titulo: string; clientes: ConFecha[]; negocio?: string }) {
  if (clientes.length === 0) return null
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">{titulo}</h2>
      <ul className="space-y-2">
        {clientes.map((c) => {
          const atrasado = diasDesdeHoy(c.leTocaVolver) < 0
          return (
            <li key={c.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <Link to={`/clientes/${c.id}`} className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <p className={`shrink-0 text-sm font-semibold ${atrasado ? 'text-amber-700' : 'text-marca-700'}`}>
                    {describirCuandoVuelve(c.leTocaVolver)}
                  </p>
                </div>
                {c.ultimaVisita && (
                  <p className="mt-0.5 text-sm text-stone-500">
                    Última visita: {formatearFechaCorta(c.ultimaVisita)} · vuelve cada {c.frecuenciaSemanas} sem
                  </p>
                )}
              </Link>
              <div className="mt-3 flex gap-2">
                <EnlaceWhatsApp href={enlaceWhatsApp(c.telefono, mensajeLeTocaVolver(c.nombre, negocio ?? 'nuestro negocio'))}>
                  Escribirle
                </EnlaceWhatsApp>
                <Link
                  to={`/agenda/nueva?clienteId=${c.id}`}
                  className="ml-auto inline-flex min-h-10 items-center rounded-xl bg-marca-600 px-3.5 text-sm font-semibold text-white hover:bg-marca-700"
                >
                  Agendar
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
