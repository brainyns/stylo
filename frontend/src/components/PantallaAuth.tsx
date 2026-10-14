import type { ReactNode } from 'react'

export function PantallaAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-12 sm:justify-center sm:pt-10">
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-marca-600 text-xl font-bold text-white">
            S
          </span>
          <span className="text-2xl font-bold tracking-tight text-marca-700">Stylo</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-stone-600">{subtitulo}</p>
      </div>
      {children}
    </main>
  )
}
