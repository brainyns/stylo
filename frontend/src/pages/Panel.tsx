import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Cita } from '../api/citas'
import { obtenerPanel, type Panel as DatosPanel, type Periodo } from '../api/panel'
import { BarrasHorizontales, GraficaApilada, GraficaBarras } from '../components/graficas'
import { AvisoError, Boton, InsigniaEstado, Spinner } from '../components/ui'
import { desdeClave, formatearDiaLargo, formatearFechaCorta, formatearHora, formatearPrecio } from '../lib/formato'

const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const FORMATO_MES_CORTO = new Intl.DateTimeFormat('es-CO', { month: 'short' })
const FORMATO_MES_LARGO = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
const FORMATO_DECIMAL = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

const plural = (n: number, uno: string, varios: string) => `${FORMATO_DECIMAL.format(n)} ${n === 1 ? uno : varios}`

/** "2026-10" → fecha del día 1 de ese mes. */
const desdeMes = (mes: string) => desdeClave(`${mes}-01`)!

/** Inicio: ingresos, citas de hoy y próximas, servicios y clientes más frecuentes, nuevos contra los que regresan. */
export default function Panel() {
  const [panel, setPanel] = useState<DatosPanel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerPanel()
      .then((p) => activo && setPanel(p))
      .catch((err: Error) => activo && setError(err.message))
    return () => {
      activo = false
    }
  }, [intento])

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 lg:max-w-6xl lg:px-8 lg:pt-10">
      <div className="mb-6">
        <h1 className="text-[1.75rem] leading-tight tracking-tight lg:text-3xl">Resumen</h1>
        {panel && <p className="mt-1 text-stone-600 first-letter:uppercase">{formatearDiaLargo(desdeClave(panel.hoy)!)}</p>}
      </div>

      {error ? (
        <div className="space-y-3">
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
      ) : !panel ? (
        <div className="flex justify-center py-16 text-marca-600">
          <Spinner className="size-8" />
          <span className="sr-only">Cargando el resumen…</span>
        </div>
      ) : (
        <Contenido panel={panel} />
      )}
    </main>
  )
}

function Contenido({ panel }: { panel: DatosPanel }) {
  const { ingresos, clientes } = panel
  const sinCobros = panel.ingresosPorDia.every((d) => d.cobros === 0)
  const visitasPorCliente = clientes.atendidosMes > 0 ? clientes.visitasMes / clientes.atendidosMes : null

  return (
    <div className="space-y-4 lg:space-y-6">
      {sinCobros && (
        <div className="rounded-2xl border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
          Los ingresos salen de las citas que marcas como <strong>atendidas</strong> con su precio. Cuando lo hagas, aquí verás
          cuánto entra cada día.
        </div>
      )}

      <section aria-label="Ingresos" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Indicador etiqueta="Hoy" periodo={ingresos.hoy} />
        <Indicador etiqueta="Esta semana" periodo={ingresos.semana} />
        <Indicador etiqueta="Este mes" periodo={ingresos.mes} comparar={ingresos.mesAnteriorAlMismoDia} />
        <Tarjeta className="p-4">
          <p className="text-xs font-medium text-stone-500">Frecuencia de pago</p>
          <p className="mt-1 text-xl font-bold tabular-nums leading-tight lg:text-2xl">
            {ingresos.ticketPromedio !== null ? formatearPrecio(ingresos.ticketPromedio) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Por cobro · {plural(ingresos.cobrosPorDia, 'cobro', 'cobros')} al día este mes
          </p>
        </Tarjeta>
      </section>

      <Tarjeta className="p-4 lg:p-6">
        <Encabezado titulo="Ingresos de los últimos 30 días" detalle={`${formatearPrecio(sumar(panel.ingresosPorDia))} en total`} />
        <GraficaBarras
          titulo="Ingresos por día de los últimos 30 días"
          datos={panel.ingresosPorDia.map((d) => ({
            clave: d.fecha,
            etiqueta: FORMATO_DIA.format(desdeClave(d.fecha)!).replace('.', ''),
            valor: d.total,
            detalle: plural(d.cobros, 'cobro', 'cobros'),
          }))}
          formatear={formatearPrecio}
          resaltar={panel.hoy}
        />
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Tarjeta className="p-4 lg:p-6">
          <Encabezado titulo="Citas de hoy" detalle={panel.citasHoy.length > 0 ? String(panel.citasHoy.length) : undefined}>
            <Link to="/agenda" className="text-sm font-semibold text-marca-700 hover:underline">
              Ver agenda
            </Link>
          </Encabezado>
          {panel.citasHoy.length === 0 ? (
            <Vacio>No tienes citas para hoy.</Vacio>
          ) : (
            <ListaCitas citas={panel.citasHoy} conFecha={false} />
          )}
        </Tarjeta>

        <Tarjeta className="p-4 lg:p-6">
          <Encabezado titulo="Próximas citas">
            <Link to="/agenda/nueva" className="text-sm font-semibold text-marca-700 hover:underline">
              Nueva cita
            </Link>
          </Encabezado>
          {panel.proximasCitas.length === 0 ? (
            <Vacio>Nada agendado para los próximos 14 días.</Vacio>
          ) : (
            <ListaCitas citas={panel.proximasCitas} conFecha />
          )}
        </Tarjeta>

        <Tarjeta className="p-4 lg:p-6">
          <Encabezado titulo="Servicios más pedidos" detalle="Últimos 90 días" />
          {panel.serviciosTop.length === 0 ? (
            <Vacio>Todavía no hay servicios atendidos.</Vacio>
          ) : (
            <BarrasHorizontales
              datos={panel.serviciosTop.map((s) => ({
                clave: s.servicio,
                etiqueta: s.servicio,
                valor: s.veces,
                texto: plural(s.veces, 'vez', 'veces'),
                detalle: formatearPrecio(s.total),
              }))}
            />
          )}
        </Tarjeta>

        <Tarjeta className="p-4 lg:p-6">
          <Encabezado titulo="Clientes más frecuentes" detalle="Últimos 90 días" />
          {panel.clientesFrecuentes.length === 0 ? (
            <Vacio>Aún no hay visitas atendidas.</Vacio>
          ) : (
            <ol className="-mx-2 divide-y divide-stone-100">
              {panel.clientesFrecuentes.map((c, i) => (
                <li key={c.id}>
                  <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-stone-50">
                    <span className="w-5 shrink-0 text-center font-display text-lg font-semibold text-stone-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.nombre}</p>
                      <p className="text-sm text-stone-500">
                        {plural(c.visitas, 'visita', 'visitas')} · {plural(c.visitas / 3, 'vez', 'veces')} al mes
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-stone-800">{formatearPrecio(c.gastado)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>

      <Tarjeta className="p-4 lg:p-6">
        <Encabezado titulo="Clientes nuevos y los que regresan" detalle={FORMATO_MES_LARGO.format(desdeClave(panel.hoy)!)} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
          <dl className="grid grid-cols-3 gap-3 self-start lg:grid-cols-1 lg:gap-5">
            <Cifra etiqueta="Nuevos este mes" valor={clientes.nuevosMes} muestra="bg-serie-2" />
            <Cifra etiqueta="Regresaron" valor={clientes.recurrentesMes} muestra="bg-serie-1" />
            <Cifra
              etiqueta="Visitas por cliente"
              valor={visitasPorCliente !== null ? FORMATO_DECIMAL.format(visitasPorCliente) : '—'}
              detalle="promedio este mes"
            />
          </dl>
          <GraficaApilada
            titulo="Clientes atendidos por mes en los últimos 6 meses, separados en nuevos y los que regresan"
            datos={clientes.porMes.map((m) => ({
              clave: m.mes,
              etiqueta: FORMATO_MES_CORTO.format(desdeMes(m.mes)).replace('.', ''),
              a: m.recurrentes,
              b: m.nuevos,
            }))}
            serieA={{ nombre: 'Regresaron', clase: 'bg-serie-1' }}
            serieB={{ nombre: 'Nuevos', clase: 'bg-serie-2' }}
          />
        </div>
      </Tarjeta>
    </div>
  )
}

const sumar = (dias: { total: number }[]) => dias.reduce((suma, d) => suma + d.total, 0)

function Indicador({ etiqueta, periodo, comparar }: { etiqueta: string; periodo: Periodo; comparar?: Periodo }) {
  return (
    <Tarjeta className="p-4">
      <p className="text-xs font-medium text-stone-500">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold tabular-nums leading-tight lg:text-2xl">{formatearPrecio(periodo.total)}</p>
      <p className="mt-0.5 text-xs text-stone-500">{plural(periodo.cobros, 'cobro', 'cobros')}</p>
      {comparar && <Variacion actual={periodo.total} anterior={comparar.total} />}
    </Tarjeta>
  )
}

/** "▲ 12 % vs. el mes pasado a esta fecha": flecha y texto, nunca solo el color. */
function Variacion({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0) {
    return actual > 0 ? <p className="mt-1.5 text-xs text-stone-500">El mes pasado a esta fecha: $ 0</p> : null
  }
  const cambio = Math.round(((actual - anterior) / anterior) * 100)
  const sube = cambio >= 0
  return (
    <p className={`mt-1.5 text-xs font-semibold ${sube ? 'text-emerald-700' : 'text-red-700'}`}>
      <span aria-hidden="true">{sube ? '▲' : '▼'}</span> {Math.abs(cambio)} %{' '}
      <span className="font-normal text-stone-500">{sube ? 'más' : 'menos'} que el mes pasado a esta fecha</span>
    </p>
  )
}

function Cifra({ etiqueta, valor, detalle, muestra }: { etiqueta: string; valor: ReactNode; detalle?: string; muestra?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
        {muestra && <span className={`size-2.5 shrink-0 rounded-sm ${muestra}`} aria-hidden="true" />}
        {etiqueta}
      </dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums leading-none">{valor}</dd>
      {detalle && <dd className="mt-1 text-xs text-stone-500">{detalle}</dd>}
    </div>
  )
}

function ListaCitas({ citas, conFecha }: { citas: Cita[]; conFecha: boolean }) {
  return (
    <ul className="-mx-2 divide-y divide-stone-100">
      {citas.map((cita) => (
        <li key={cita.id}>
          <Link to={`/agenda/${cita.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-stone-50">
            <div className="w-20 shrink-0 text-sm">
              {conFecha && <p className="text-xs text-stone-500 first-letter:uppercase">{formatearFechaCorta(cita.inicio)}</p>}
              <p className="font-semibold tabular-nums">{formatearHora(cita.inicio)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{cita.cliente.nombre}</p>
              <p className="truncate text-sm text-stone-500">{cita.servicio}</p>
            </div>
            {!conFecha && <InsigniaEstado estado={cita.estado} />}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Tarjeta({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>{children}</section>
}

function Encabezado({ titulo, detalle, children }: { titulo: string; detalle?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-bold tracking-tight">
        {titulo}
        {detalle && <span className="ml-2 text-sm font-normal text-stone-500 first-letter:uppercase">{detalle}</span>}
      </h2>
      {children}
    </div>
  )
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{children}</p>
}
