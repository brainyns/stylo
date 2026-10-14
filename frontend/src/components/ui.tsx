import type { ButtonHTMLAttributes, ReactNode } from 'react'
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
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {mensaje}
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

/** Círculo con el color del tono de la clienta. */
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

export function PantallaCargando() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-marca-600">
      <Spinner className="size-8" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
