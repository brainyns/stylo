import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { TipoNegocio } from '../api/auth'
import { ApiError } from '../api/client'
import { actualizarCita, cambiarEstadoCita, type Cita, type EstadoCita } from '../api/citas'
import { claveDia, claveHora, formatearDiaLargo, formatearPrecio } from '../lib/formato'
import { DURACIONES_MINUTOS, SERVICIOS_SUGERIDOS, formatearDuracion } from '../lib/servicios'
import { formatearTelefono } from '../lib/tonos'
import { enlaceWhatsApp, mensajeRecordatorioCita } from '../lib/whatsapp'
import { AvisoError, Boton, Campo, ChipsServicios, EnlaceWhatsApp, InsigniaEstado, claseInput } from './ui'

interface Edicion {
  fecha: string
  hora: string
  duracionMinutos: number
  servicio: string
  precio: string
}

const desdeCita = (cita: Cita): Edicion => {
  const inicio = new Date(cita.inicio)
  return {
    fecha: claveDia(inicio),
    hora: claveHora(inicio),
    duracionMinutos: cita.duracionMinutos,
    servicio: cita.servicio,
    precio: cita.precio !== null ? String(cita.precio) : '',
  }
}

/**
 * Se abre al tocar una cita del calendario: ahí mismo se cambia la hora, la fecha, la duración,
 * el servicio o el precio, y se marca atendida o "no vino". Lo demás (notas, eliminar) va en el formulario completo.
 * Abajo en el celular, centrado en computador.
 */
export function DetalleCita({
  cita,
  tipo,
  negocio,
  onCerrar,
  onCambio,
}: {
  cita: Cita
  tipo: TipoNegocio
  negocio: string
  onCerrar: () => void
  onCambio: (actualizada: Cita) => void
}) {
  const refDialogo = useRef<HTMLDialogElement>(null)
  const [datos, setDatos] = useState<Edicion>(() => desdeCita(cita))
  const [guardando, setGuardando] = useState<'edicion' | EstadoCita | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    const dialogo = refDialogo.current
    dialogo?.showModal()
    return () => dialogo?.close()
  }, [])

  const original = desdeCita(cita)
  const cambio = (Object.keys(original) as (keyof Edicion)[]).some((k) => original[k] !== datos[k])
  const precioNumero = Number(datos.precio.replace(/\D/g, ''))

  const cambiar =
    (campo: keyof Edicion) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDatos((d) => ({ ...d, [campo]: campo === 'duracionMinutos' ? Number(e.target.value) : e.target.value }))

  function mostrarError(err: unknown) {
    setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    setErrores(err instanceof ApiError ? err.errores : {})
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
    if (!datos.servicio.trim()) {
      setErrores({ servicio: 'Escribe el servicio' })
      return
    }
    setGuardando('edicion')
    try {
      const precio = datos.precio.replace(/\D/g, '')
      onCambio(
        await actualizarCita(cita.id, {
          clienteId: cita.cliente.id,
          inicio: inicio.toISOString(),
          duracionMinutos: datos.duracionMinutos,
          servicio: datos.servicio.trim(),
          precio: precio ? Number(precio) : null,
          estado: cita.estado,
          notas: cita.notas,
        }),
      )
    } catch (err) {
      mostrarError(err)
      setGuardando(null)
    }
  }

  async function marcar(estado: EstadoCita) {
    setError(null)
    setGuardando(estado)
    try {
      onCambio(await cambiarEstadoCita(cita.id, estado))
    } catch (err) {
      mostrarError(err)
      setGuardando(null)
    }
  }

  const ocupado = guardando !== null

  return (
    <dialog
      ref={refDialogo}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      aria-labelledby="detalle-cita-titulo"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/clientes/${cita.cliente.id}`}
              id="detalle-cita-titulo"
              className="block truncate font-display text-2xl font-semibold tracking-tight hover:underline"
            >
              {cita.cliente.nombre}
            </Link>
            <p className="mt-0.5 text-sm text-stone-500">
              {formatearTelefono(cita.cliente.telefono)} · <span className="first-letter:uppercase">{formatearDiaLargo(cita.inicio)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl text-stone-500 hover:bg-stone-100"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <InsigniaEstado estado={cita.estado} />
          {cita.estado === 'PROGRAMADA' && (
            <EnlaceWhatsApp
              href={enlaceWhatsApp(cita.cliente.telefono, mensajeRecordatorioCita(cita.cliente.nombre, negocio, cita.inicio))}
            >
              Recordar
            </EnlaceWhatsApp>
          )}
        </div>

        {cita.estado === 'PROGRAMADA' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Boton onClick={() => marcar('COMPLETADA')} cargando={guardando === 'COMPLETADA'} disabled={ocupado}>
              ✓ Atendida
            </Boton>
            <Boton variante="secundario" onClick={() => marcar('NO_ASISTIO')} cargando={guardando === 'NO_ASISTIO'} disabled={ocupado}>
              No vino
            </Boton>
          </div>
        )}

        <form onSubmit={guardar} className="mt-6 space-y-4 border-t border-stone-100 pt-5" noValidate>
          <AvisoError mensaje={error} />

          <div className="grid grid-cols-2 gap-3">
            <Campo id="detalle-fecha" etiqueta="Fecha" error={errores.inicio}>
              <input
                id="detalle-fecha"
                type="date"
                value={datos.fecha}
                onChange={cambiar('fecha')}
                className={claseInput}
                aria-invalid={!!errores.inicio}
              />
            </Campo>
            <Campo id="detalle-hora" etiqueta="Hora">
              <input id="detalle-hora" type="time" step={900} value={datos.hora} onChange={cambiar('hora')} className={claseInput} />
            </Campo>
          </div>

          <Campo id="detalle-servicio" etiqueta="Servicio" error={errores.servicio}>
            <input
              id="detalle-servicio"
              autoComplete="off"
              value={datos.servicio}
              onChange={cambiar('servicio')}
              className={claseInput}
              aria-invalid={!!errores.servicio}
            />
            <ChipsServicios
              sugeridos={SERVICIOS_SUGERIDOS[tipo]}
              valor={datos.servicio}
              onElegir={(s) => setDatos((d) => ({ ...d, servicio: s }))}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo id="detalle-duracion" etiqueta="Duración" error={errores.duracionMinutos}>
              <select id="detalle-duracion" value={datos.duracionMinutos} onChange={cambiar('duracionMinutos')} className={claseInput}>
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
              id="detalle-precio"
              etiqueta="Precio"
              opcional
              error={errores.precio}
              ayuda={precioNumero > 0 ? formatearPrecio(precioNumero) : undefined}
            >
              <input
                id="detalle-precio"
                inputMode="numeric"
                autoComplete="off"
                placeholder="25000"
                value={datos.precio}
                onChange={cambiar('precio')}
                className={claseInput}
                aria-invalid={!!errores.precio}
              />
            </Campo>
          </div>

          <Boton type="submit" variante={cambio ? 'primario' : 'secundario'} cargando={guardando === 'edicion'} disabled={!cambio || ocupado}>
            {cambio ? 'Guardar cambios' : 'Sin cambios'}
          </Boton>
        </form>

        <Link
          to={`/agenda/${cita.id}`}
          className="mt-3 flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100"
        >
          Notas, estado o eliminar ›
        </Link>
      </div>
    </dialog>
  )
}
