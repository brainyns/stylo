import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { NOMBRE_TIPO_NEGOCIO, obtenerSalon, type Salon } from '../api/auth'
import type { ContextoNegocio } from '../lib/negocio'
import { borrarSesion } from '../lib/sesion'

/** Encabezado con el negocio y barra inferior de pestañas (Agenda, Clientes, Por volver). */
export function Layout() {
  const navigate = useNavigate()
  const [salon, setSalon] = useState<Salon | null>(null)

  useEffect(() => {
    let activo = true
    // Si falla, el encabezado queda sin nombre; cada pantalla muestra sus propios errores
    obtenerSalon()
      .then((s) => activo && setSalon(s))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  function cerrarSesion() {
    borrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh pb-40">
      <header className="sticky top-0 z-10 bg-stone-950 pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-marca-300 font-display text-lg font-bold text-stone-950"
              aria-hidden="true"
            >
              S
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-marca-300">
                Stylo{salon && ` · ${NOMBRE_TIPO_NEGOCIO[salon.tipo]}`}
              </p>
              <p className="truncate text-lg font-bold">{salon?.nombre ?? ' '}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white active:bg-white/15"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <Outlet context={{ salon } satisfies ContextoNegocio} />

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3">
          <Pestana to="/agenda" etiqueta="Agenda" icono={<IconoCalendario />} />
          <Pestana to="/clientes" etiqueta="Clientes" icono={<IconoPersonas />} />
          <Pestana to="/por-volver" etiqueta="Por volver" icono={<IconoVolver />} />
        </div>
      </nav>
    </div>
  )
}

function Pestana({ to, etiqueta, icono }: { to: string; etiqueta: string; icono: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-marca-700' : 'text-stone-500 hover:text-stone-800'
        }`
      }
    >
      {icono}
      {etiqueta}
    </NavLink>
  )
}

/** Botón redondo fijo sobre la barra de pestañas, para la acción principal de la pantalla. */
export function EnlaceFlotante({ to, children }: { to: string; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20">
      <div className="mx-auto flex max-w-2xl justify-end px-4">
        <Link
          to={to}
          className="pointer-events-auto flex min-h-14 items-center gap-2 rounded-full bg-marca-600 px-6 text-base font-semibold text-white shadow-lg shadow-black/15 hover:bg-marca-700 active:bg-marca-800"
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            +
          </span>
          {children}
        </Link>
      </div>
    </div>
  )
}

const propsIcono = {
  className: 'size-6',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function IconoCalendario() {
  return (
    <svg {...propsIcono}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}

function IconoPersonas() {
  return (
    <svg {...propsIcono}>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.8c1.7.8 2.7 2.5 3 5.2" />
    </svg>
  )
}

function IconoVolver() {
  return (
    <svg {...propsIcono}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7" />
      <path d="M4 4v4.7h4.7M12 8v4.5l3 1.8" />
    </svg>
  )
}
