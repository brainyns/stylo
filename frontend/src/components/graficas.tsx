import { useState, type ReactNode } from 'react'

/*
 * Gráficas simples en HTML + Tailwind, sin librerías. Siguen la guía de dataviz:
 * barras delgadas con 2px de separación, punta redondeada de 4px anclada a la base,
 * rejilla y ejes discretos, textos en tinta (nunca del color de la serie), tooltip al pasar
 * o tocar cada barra y una tabla con los mismos datos para quien no ve la gráfica.
 */

export interface Barra {
  clave: string
  /** Texto del eje y del tooltip, ej. "22 oct". */
  etiqueta: string
  valor: number
  /** Línea extra del tooltip, ej. "3 cobros". */
  detalle?: string
}

/** Barras verticales de una sola serie (ej. ingresos por día). `resaltar` marca una barra, ej. hoy. */
export function GraficaBarras({
  titulo,
  datos,
  formatear,
  resaltar,
  cadaCuantasEtiquetas = 7,
}: {
  titulo: string
  datos: Barra[]
  formatear: (valor: number) => string
  resaltar?: string
  cadaCuantasEtiquetas?: number
}) {
  const [activa, setActiva] = useState<number | null>(null)
  const maximo = Math.max(...datos.map((d) => d.valor), 0)
  const barra = activa !== null ? datos[activa] : null

  return (
    <figure>
      <div className="relative">
        {/* Tooltip encima de la gráfica, alineado con la barra activa */}
        <div className="pointer-events-none h-12" aria-hidden="true">
          {barra && (
            <div
              className="absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: `clamp(3.5rem, ${((activa! + 0.5) / datos.length) * 100}%, calc(100% - 3.5rem))` }}
            >
              <p className="font-semibold">{formatear(barra.valor)}</p>
              <p className="text-stone-300 first-letter:uppercase">
                {barra.etiqueta}
                {barra.detalle && ` · ${barra.detalle}`}
              </p>
            </div>
          )}
        </div>

        <div className="relative h-40 border-b border-stone-300" role="img" aria-label={`${titulo}. Máximo ${formatear(maximo)}.`}>
          {maximo > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-stone-200">
              <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[0.6875rem] tabular-nums text-stone-400">
                {formatear(maximo)}
              </span>
            </div>
          )}
          <div className="flex h-full items-end gap-[2px]" onPointerLeave={() => setActiva(null)}>
            {datos.map((d, i) => {
              const alto = maximo > 0 ? (d.valor / maximo) * 100 : 0
              const esResaltada = d.clave === resaltar
              return (
                // La columna completa es el blanco del puntero; la barra visible puede ser mínima
                <div
                  key={d.clave}
                  className="flex h-full min-w-0 flex-1 cursor-default items-end"
                  onPointerEnter={() => setActiva(i)}
                  onClick={() => setActiva(i)}
                >
                  <div
                    className={`w-full rounded-t-[4px] transition-opacity ${
                      esResaltada ? 'bg-serie-1' : 'bg-serie-1/55'
                    } ${activa !== null && activa !== i ? 'opacity-50' : ''}`}
                    style={{ height: d.valor > 0 ? `max(${alto}%, 3px)` : 0 }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex text-[0.6875rem] text-stone-500" aria-hidden="true">
        {datos.map((d, i) => (
          <span key={d.clave} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {(datos.length - 1 - i) % cadaCuantasEtiquetas === 0 ? d.etiqueta : ''}
          </span>
        ))}
      </div>

      <VerTabla
        columnas={['Día', 'Valor']}
        filas={datos.map((d) => [d.etiqueta, `${formatear(d.valor)}${d.detalle ? ` (${d.detalle})` : ''}`])}
      />
    </figure>
  )
}

export interface BarraApilada {
  clave: string
  etiqueta: string
  a: number
  b: number
}

/** Barras verticales apiladas de dos series, con leyenda y el total encima de cada barra. */
export function GraficaApilada({
  titulo,
  datos,
  serieA,
  serieB,
}: {
  titulo: string
  datos: BarraApilada[]
  /** Va abajo, pegada a la base. */
  serieA: { nombre: string; clase: string }
  serieB: { nombre: string; clase: string }
}) {
  const [activa, setActiva] = useState<number | null>(null)
  const maximo = Math.max(...datos.map((d) => d.a + d.b), 0)

  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        <Leyenda clase={serieA.clase}>{serieA.nombre}</Leyenda>
        <Leyenda clase={serieB.clase}>{serieB.nombre}</Leyenda>
      </div>

      <div
        className="flex h-36 items-end gap-3 border-b border-stone-300 sm:gap-5"
        role="img"
        aria-label={titulo}
        onPointerLeave={() => setActiva(null)}
      >
        {datos.map((d, i) => {
          const total = d.a + d.b
          const alto = maximo > 0 ? (total / maximo) * 100 : 0
          const atenuada = activa !== null && activa !== i
          return (
            <div
              key={d.clave}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              onPointerEnter={() => setActiva(i)}
              onClick={() => setActiva(i)}
            >
              {activa === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                  <p className="font-semibold first-letter:uppercase">{d.etiqueta}</p>
                  <p className="text-stone-300">
                    {serieA.nombre}: {d.a} · {serieB.nombre}: {d.b}
                  </p>
                </div>
              )}
              <span className="mb-1 text-xs font-semibold tabular-nums text-stone-700">{total > 0 ? total : ''}</span>
              <div
                className={`flex w-full max-w-10 flex-col-reverse gap-[2px] transition-opacity ${atenuada ? 'opacity-50' : ''}`}
                style={{ height: `${alto}%` }}
              >
                {d.a > 0 && <div className={`${serieA.clase} ${d.b > 0 ? '' : 'rounded-t-[4px]'}`} style={{ flexGrow: d.a }} />}
                {d.b > 0 && <div className={`${serieB.clase} rounded-t-[4px]`} style={{ flexGrow: d.b }} />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-3 text-xs text-stone-500 sm:gap-5" aria-hidden="true">
        {datos.map((d) => (
          <span key={d.clave} className="min-w-0 flex-1 text-center first-letter:uppercase">
            {d.etiqueta}
          </span>
        ))}
      </div>

      <VerTabla
        columnas={['Mes', serieA.nombre, serieB.nombre]}
        filas={datos.map((d) => [d.etiqueta, String(d.a), String(d.b)])}
      />
    </figure>
  )
}

/** Ranking corto (≤ 5 filas): nombre y valor como texto, la barra solo da la proporción. */
export function BarrasHorizontales({
  datos,
}: {
  datos: { clave: string; etiqueta: string; valor: number; texto: string; detalle?: string }[]
}) {
  const maximo = Math.max(...datos.map((d) => d.valor), 0)
  return (
    <ul className="space-y-3.5">
      {datos.map((d) => (
        <li key={d.clave} title={d.detalle}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-stone-800">{d.etiqueta}</span>
            <span className="shrink-0 tabular-nums text-stone-600">
              {d.texto}
              {d.detalle && <span className="text-stone-400"> · {d.detalle}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-serie-1" style={{ width: `${maximo > 0 ? (d.valor / maximo) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Leyenda({ clase, children }: { clase: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${clase}`} aria-hidden="true" />
      {children}
    </span>
  )
}

function VerTabla({ columnas, filas }: { columnas: string[]; filas: string[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-stone-500 hover:text-stone-800">Ver como tabla</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-stone-200">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-stone-50 text-xs text-stone-500">
            <tr>
              {columnas.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.map((fila) => (
              <tr key={fila[0]}>
                {fila.map((celda, i) => (
                  <td key={i} className={`px-3 py-1.5 ${i > 0 ? 'tabular-nums' : 'first-letter:uppercase'}`}>
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
