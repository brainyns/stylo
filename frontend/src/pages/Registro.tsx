import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { NOMBRE_TIPO_NEGOCIO, registrar, type TipoNegocio } from '../api/auth'
import { ApiError } from '../api/client'
import { ListaBeneficios, PantallaAuth } from '../components/PantallaAuth'
import { AvisoError, Boton, Campo, claseInput } from '../components/ui'
import { guardarSesion } from '../lib/sesion'

export default function Registro() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', telefono: '', tipo: 'PELUQUERIA' as TipoNegocio })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cambiar = (campo: Exclude<keyof typeof datos, 'tipo'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setErrores({})
    try {
      const telefono = datos.telefono.trim()
      guardarSesion(await registrar({ ...datos, nombre: datos.nombre.trim(), telefono: telefono || undefined }))
      navigate('/agenda', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      if (err instanceof ApiError) setErrores(err.errores)
      setEnviando(false)
    }
  }

  return (
    <PantallaAuth
      titulo="Registra tu negocio"
      subtitulo="Stylo recuerda por ti el corte, la fórmula y cuándo le toca volver a cada cliente. Para barbers y peluquerías."
    >
      <ListaBeneficios className="mb-8 lg:hidden" />
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <AvisoError mensaje={error} />
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 block text-sm font-medium text-stone-700">Tipo de negocio</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(NOMBRE_TIPO_NEGOCIO) as TipoNegocio[]).map((tipo) => (
              <label
                key={tipo}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-stone-300 bg-white px-2 py-2 text-center text-sm font-semibold leading-tight text-stone-700 hover:bg-stone-100 has-checked:border-marca-600 has-checked:bg-marca-50 has-checked:text-marca-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-marca-600"
              >
                <input
                  type="radio"
                  name="tipo"
                  value={tipo}
                  checked={datos.tipo === tipo}
                  onChange={() => setDatos((d) => ({ ...d, tipo }))}
                  className="sr-only"
                />
                {tipo === 'MIXTO' ? 'Ambas' : NOMBRE_TIPO_NEGOCIO[tipo]}
              </label>
            ))}
          </div>
          {errores.tipo && <p className="text-sm text-red-700">{errores.tipo}</p>}
        </fieldset>
        <Campo id="nombre" etiqueta="Nombre del negocio" error={errores.nombre}>
          <input
            id="nombre"
            autoComplete="organization"
            required
            value={datos.nombre}
            onChange={cambiar('nombre')}
            aria-invalid={!!errores.nombre}
            className={claseInput}
          />
        </Campo>
        <Campo id="email" etiqueta="Correo" error={errores.email}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={datos.email}
            onChange={cambiar('email')}
            aria-invalid={!!errores.email}
            className={claseInput}
          />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres.">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={datos.password}
            onChange={cambiar('password')}
            aria-invalid={!!errores.password}
            className={claseInput}
          />
        </Campo>
        <Campo id="telefono" etiqueta="Teléfono" opcional error={errores.telefono}>
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={datos.telefono}
            onChange={cambiar('telefono')}
            aria-invalid={!!errores.telefono}
            className={claseInput}
          />
        </Campo>
        <Boton type="submit" cargando={enviando}>
          Crear cuenta
        </Boton>
      </form>
      <p className="mt-8 text-center text-stone-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-marca-700 underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </PantallaAuth>
  )
}
