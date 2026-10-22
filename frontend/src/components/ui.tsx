import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { NOMBRE_ESTADO, type EstadoCita } from '../api/citas'
import { colorDeTono } from '../lib/tonos'

const VARIANTES = {
  primario: 'bg-marca-600 text-white shadow-sm hover:bg-marca-700 active:bg-marca-800',
  secundario: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 active:bg-stone-200',
  peligro: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  peligroSuave: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 active:bg-red-100',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof VARIANTES
  cargando?: boolean
}

export function Boton({ variante = 'primario', cargando = false, className = '', disabled, children, ...props }: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
    >
      {cargando && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/** Mensaje general de error (el `detail` del ProblemDetail). */
export function AvisoError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <svg className="mt-px size-5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{mensaje}</span>
    </div>
  )
}

export const claseInput =
  'block min-h-12 w-full rounded-xl border bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 aria-invalid:border-red-400 aria-invalid:focus:ring-red-200 border-stone-300 focus:border-marca-600 focus:ring-marca-100'

interface CampoProps {
  id: string
  etiqueta: string
  error?: string
  ayuda?: string
  opcional?: boolean
  children: ReactNode
}

/** Etiqueta + control + error del campo que devolvió el backend. */
export function Campo({ id, etiqueta, error, ayuda, opcional, children }: CampoProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {etiqueta}
        {opcional && <span className="font-normal text-stone-400"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-sm text-stone-500">{ayuda}</p>
      )}
    </div>
  )
}

/** Círculo con el color del tono del cliente. */
export function CirculoTono({ tono, className = 'size-11' }: { tono: string | null; className?: string }) {
  const color = colorDeTono(tono)
  if (!color) {
    return (
      <span
        className={`${className} shrink-0 rounded-full border-2 border-dashed border-stone-300 bg-stone-100`}
        aria-hidden="true"
      />
    )
  }
  return (
    <span
      className={`${className} shrink-0 rounded-full shadow-inner ring-1 ring-black/10`}
      style={{ background: color }}
      aria-hidden="true"
    />
  )
}

/** Círculo del tono si el cliente tiene uno; si no, sus iniciales (en barber casi nunca hay tono). */
export function AvatarCliente({ nombre, tono, className = 'size-11 text-base' }: { nombre: string; tono: string | null; className?: string }) {
  if (colorDeTono(tono)) return <CirculoTono tono={tono} className={className} />
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-stone-900 font-bold text-marca-300`}
      aria-hidden="true"
    >
      {iniciales || '·'}
    </span>
  )
}

export function PantallaCargando() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-marca-600">
      <Spinner className="size-8" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}

/** Botón verde de WhatsApp que abre el chat con el mensaje ya escrito. */
export function EnlaceWhatsApp({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#25D366]/10 px-3.5 text-sm font-semibold text-[#128C4B] ring-1 ring-inset ring-[#25D366]/40 hover:bg-[#25D366]/20 ${className}`}
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      {children}
    </a>
  )
}

const COLOR_ESTADO: Record<EstadoCita, string> = {
  PROGRAMADA: 'bg-sky-50 text-sky-800 ring-sky-200',
  COMPLETADA: 'bg-marca-50 text-marca-800 ring-marca-200',
  NO_ASISTIO: 'bg-amber-50 text-amber-900 ring-amber-200',
  CANCELADA: 'bg-stone-100 text-stone-600 ring-stone-200',
}

export function InsigniaEstado({ estado, className = '' }: { estado: EstadoCita; className?: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${COLOR_ESTADO[estado]} ${className}`}
    >
      {NOMBRE_ESTADO[estado]}
    </span>
  )
}
