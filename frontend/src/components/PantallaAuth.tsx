import type { ReactNode } from 'react'

const BENEFICIOS = [
  'La ficha de cada cliente en tu celular, sin cuadernos.',
  'Sabes cada cuánto debe volver cada cliente.',
  'Recordatorios por WhatsApp con un solo toque.',
]

// Rayas diagonales muy tenues, guiño al poste de barbería sin recargar el panel
const RAYAS = {
  backgroundImage: 'repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)',
  maskImage: 'radial-gradient(ellipse at 100% 0%, black, transparent 70%)',
}

/**
 * Login y registro: panel oscuro con la marca y el formulario sobre fondo claro.
 * En el celular el panel se reduce a una franja arriba; desde lg es la columna izquierda (40 %),
 * y en pantallas muy anchas se queda en 36rem para que el formulario no flote en un mar vacío.
 */
export function PantallaAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[2fr_3fr] 2xl:grid-cols-[36rem_1fr]">
      <aside className="relative isolate overflow-hidden bg-stone-950 text-stone-100 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16 xl:py-14">
        <div className="absolute inset-0 -z-10 text-marca-300/15" style={RAYAS} aria-hidden="true" />
        <div className="mx-auto flex max-w-sm items-center px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-md lg:mx-0 lg:max-w-none lg:p-0">
          <Marca />
        </div>

        <div className="hidden max-w-md lg:block">
          <p className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-balance text-white xl:text-[2.75rem]">
            Que tus clientes siempre vuelvan.
          </p>
          <ListaBeneficios className="mt-8 xl:mt-10" oscuro />
        </div>

        <p className="hidden text-sm text-stone-400 lg:block">Para barbers y peluquerías en Colombia.</p>
      </aside>

      <main className="flex justify-center px-5 pb-12 pt-8 sm:pt-12 lg:items-center lg:px-12 lg:py-12">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-[26rem]">
          <div className="mb-7 sm:mb-8">
            <h1 className="text-[1.75rem] leading-tight tracking-tight text-balance text-stone-950 sm:text-3xl">{titulo}</h1>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone-600 sm:text-base">{subtitulo}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

function Marca() {
  return (
    <span className="flex items-center gap-2.5 lg:gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-marca-300 font-display text-lg font-bold text-stone-950 lg:size-10 lg:rounded-xl lg:text-xl">
        S
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-white lg:text-2xl">Stylo</span>
    </span>
  )
}

/** Lo que gana el negocio con Stylo. En el registro se repite debajo del título cuando no se ve el panel. */
export function ListaBeneficios({ className = '', oscuro = false }: { className?: string; oscuro?: boolean }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {BENEFICIOS.map((beneficio) => (
        <li
          key={beneficio}
          className={`flex items-start gap-3 text-[0.9375rem] leading-snug ${oscuro ? 'text-stone-300 xl:text-base' : 'text-stone-700'}`}
        >
          <span
            className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              oscuro ? 'bg-marca-300/15 text-marca-300' : 'bg-marca-100 text-marca-700'
            }`}
            aria-hidden="true"
          >
            ✓
          </span>
          {beneficio}
        </li>
      ))}
    </ul>
  )
}
