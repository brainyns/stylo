import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { registrar } from '../api/auth'
import { ApiError } from '../api/client'
import { PantallaAuth } from '../components/PantallaAuth'
import { AvisoError, Boton, Campo, claseInput } from '../components/ui'
import { guardarSesion } from '../lib/sesion'

export default function Registro() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', telefono: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setErrores({})
    try {
      const telefono = datos.telefono.trim()
      guardarSesion(await registrar({ ...datos, nombre: datos.nombre.trim(), telefono: telefono || undefined }))
      navigate('/clientas', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      if (err instanceof ApiError) setErrores(err.errores)
      setEnviando(false)
    }
  }

  return (
    <PantallaAuth titulo="Registra tu salón" subtitulo="Crea tu cuenta y empieza a guardar las fórmulas de tus clientas.">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <AvisoError mensaje={error} />
        <Campo id="nombre" etiqueta="Nombre del salón" error={errores.nombre}>
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
