import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { obtenerSalon, type Salon } from '../api/auth'
import { listarCitasDeCliente, type Cita } from '../api/citas'
import { obtenerCliente, type Cliente } from '../api/clientes'
import { EncabezadoVolver } from '../components/Layout'
import { AvatarCliente, AvisoError, EnlaceWhatsApp, InsigniaEstado, PantallaCargando } from '../components/ui'
import { describirCuandoVuelve, diasDesdeHoy, formatearFechaCorta, formatearHora, formatearPrecio } from '../lib/formato'
import { formatearTelefono } from '../lib/tonos'
import { enlaceWhatsApp, mensajeLeTocaVolver } from '../lib/whatsapp'

const FORMATO_DESDE = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })

/** Ficha del cliente: sus datos, cuánto viene y cuánto ha gastado, y todas sus citas. */
export default function ClienteFicha() {
  const { id = '' } = useParams()
  const location = useLocation()
  const aviso = (location.state as { aviso?: string } | null)?.aviso
  // `cargadoEn` separa próximas e historial con la misma hora que usó el backend para `proximaCita`
  const [datos, setDatos] = useState<{ cliente: Cliente; citas: Cita[]; salon: Salon; cargadoEn: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    Promise.all([obtenerCliente(id), listarCitasDeCliente(id), obtenerSalon()])
      .then(([cliente, citas, salon]) => activo && setDatos({ cliente, citas, salon, cargadoEn: Date.now() }))
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [id])

  if (error) {
    return (
      <div className="min-h-dvh">
        <EncabezadoVolver to="/clientes">Clientes</EncabezadoVolver>
        <main className="mx-auto max-w-2xl space-y-3 px-4 pt-6">
          <AvisoError mensaje={error} />
          <Link to="/clientes" className="block py-3 text-center font-semibold text-marca-700">
            Volver a la lista
          </Link>
        </main>
      </div>
    )
  }
  if (!datos) return <PantallaCargando />

  const { cliente, citas, salon, cargadoEn } = datos
  // Próximas: programadas desde ahora, la más cercana primero. El resto es historial (ya viene de la más reciente)
  const proximas = citas
    .filter((c) => c.estado === 'PROGRAMADA' && new Date(c.inicio).getTime() >= cargadoEn)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
  const historial = citas.filter((c) => !proximas.includes(c))
  const promedio = cliente.visitas > 0 ? Math.round(cliente.totalGastado / cliente.visitas) : null
  const atrasado = !cliente.proximaCita && cliente.leTocaVolver !== null && diasDesdeHoy(cliente.leTocaVolver) < 0
  const conColor = salon.tipo !== 'BARBERIA' && (cliente.tono || cliente.formula)

  return (
    <div className="min-h-dvh pb-12">
      <EncabezadoVolver to="/clientes">Clientes</EncabezadoVolver>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {aviso && (
          <div role="status" className="mb-5 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
            {aviso}
          </div>
        )}

        <div className="flex items-start gap-4">
          <AvatarCliente nombre={cliente.nombre} tono={cliente.tono} className="size-16 text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.75rem] leading-tight tracking-tight break-words">{cliente.nombre}</h1>
            <p className="mt-1 text-stone-600">
              {formatearTelefono(cliente.telefono)}
              {cliente.email && (
                <>
                  {' · '}
                  <a href={`mailto:${cliente.email}`} className="break-all text-marca-700 underline-offset-4 hover:underline">
                    {cliente.email}
                  </a>
                </>
              )}
            </p>
            <p className="mt-0.5 text-sm text-stone-500">Cliente desde {FORMATO_DESDE.format(new Date(cliente.creadoEn))}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <EnlaceWhatsApp
            href={enlaceWhatsApp(cliente.telefono, mensajeLeTocaVolver(cliente.nombre, salon.nombre))}
            className="min-h-11 justify-center"
          >
            Escribirle
          </EnlaceWhatsApp>
          <Link
            to={`/agenda/nueva?clienteId=${cliente.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-marca-600 px-3 text-sm font-semibold text-white hover:bg-marca-700"
          >
            Agendar
          </Link>
          <Link
            to={`/clientes/${cliente.id}/editar`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
          >
            Editar
          </Link>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Dato etiqueta="Visitas" valor={cliente.visitas} detalle={cliente.visitas === 1 ? 'cita atendida' : 'citas atendidas'} />
          <Dato
            etiqueta="Total gastado"
            valor={formatearPrecio(cliente.totalGastado)}
            detalle={promedio !== null ? `${formatearPrecio(promedio)} por visita` : 'Sin cobros aún'}
          />
          <Dato
            etiqueta="Última visita"
            valor={cliente.ultimaVisita ? formatearFechaCorta(cliente.ultimaVisita) : 'Aún no'}
            detalle={cliente.ultimaVisita ? haceCuanto(cliente.ultimaVisita) : undefined}
          />
          {cliente.proximaCita ? (
            <Dato
              etiqueta="Próxima cita"
              valor={formatearFechaCorta(cliente.proximaCita)}
              detalle={formatearHora(cliente.proximaCita)}
              tono="cita"
            />
          ) : (
            <Dato
              etiqueta="Le toca volver"
              valor={cliente.leTocaVolver ? formatearFechaCorta(cliente.leTocaVolver) : 'Sin fecha'}
              detalle={
                cliente.leTocaVolver
                  ? describirCuandoVuelve(cliente.leTocaVolver)
                  : `Vuelve cada ${cliente.frecuenciaSemanas} sem`
              }
              tono={atrasado ? 'atrasado' : undefined}
            />
          )}
        </dl>

        {(cliente.notas || conColor) && (
          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-500">Notas</h2>
            {cliente.notas && <p className="mt-1 whitespace-pre-line text-stone-800">{cliente.notas}</p>}
            {conColor && (
              <p className="mt-2 text-sm text-stone-700">
                <span className="font-semibold">Color:</span> {[cliente.tono, cliente.formula].filter(Boolean).join(' · ')}
              </p>
            )}
          </section>
        )}

        {proximas.length > 0 && (
          <ListaCitas titulo="Próximas citas">
            {proximas.map((cita) => (
              <FilaCita key={cita.id} cita={cita} />
            ))}
          </ListaCitas>
        )}

        <ListaCitas titulo="Historial" contador={historial.length}>
          {historial.length === 0 ? (
            <li className="px-4 py-8 text-center text-stone-500">Todavía no tiene citas pasadas.</li>
          ) : (
            historial.map((cita) => <FilaCita key={cita.id} cita={cita} />)
          )}
        </ListaCitas>
      </main>
    </div>
  )
}

/** "hace 3 semanas", para dar contexto a la fecha de la última visita. */
function haceCuanto(fecha: string): string {
  const dias = -diasDesdeHoy(fecha)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 14) return `hace ${dias} días`
  if (dias < 60) return `hace ${Math.round(dias / 7)} semanas`
  return `hace ${Math.round(dias / 30)} meses`
}

function Dato({
  etiqueta,
  valor,
  detalle,
  tono,
}: {
  etiqueta: string
  valor: ReactNode
  detalle?: string
  tono?: 'cita' | 'atrasado'
}) {
  const fondo =
    tono === 'atrasado' ? 'border-amber-200 bg-amber-50' : tono === 'cita' ? 'border-sky-200 bg-sky-50' : 'border-stone-200 bg-white'
  return (
    <div className={`rounded-2xl border p-4 ${fondo}`}>
      <dt className="text-xs font-medium text-stone-500">{etiqueta}</dt>
      <dd className="mt-1 text-lg font-bold leading-tight tabular-nums first-letter:uppercase">{valor}</dd>
      {detalle && (
        <dd className={`mt-0.5 text-xs first-letter:uppercase ${tono === 'atrasado' ? 'text-amber-800' : 'text-stone-500'}`}>
          {detalle}
        </dd>
      )}
    </div>
  )
}

function ListaCitas({ titulo, contador, children }: { titulo: string; contador?: number; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold tracking-tight">
        {titulo}
        {contador !== undefined && contador > 0 && <span className="text-sm font-normal text-stone-500">{contador}</span>}
      </h2>
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">{children}</ul>
    </section>
  )
}

function FilaCita({ cita }: { cita: Cita }) {
  return (
    <li>
      <Link to={`/agenda/${cita.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{cita.servicio}</p>
          <p className="text-sm text-stone-500 first-letter:uppercase">
            {formatearFechaCorta(cita.inicio)}, {formatearHora(cita.inicio)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <InsigniaEstado estado={cita.estado} />
          {cita.precio !== null && (
            <span className={`text-sm tabular-nums ${cita.estado === 'COMPLETADA' ? 'font-semibold text-stone-900' : 'text-stone-500'}`}>
              {formatearPrecio(cita.precio)}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}
