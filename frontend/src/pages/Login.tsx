import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { iniciarSesion } from '../api/auth'
import { ApiError } from '../api/client'
import { PantallaAuth } from '../components/PantallaAuth'
import { AvisoError, Boton, Campo, claseInput } from '../components/ui'
import { guardarSesion } from '../lib/sesion'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setErrores({})
    try {
      guardarSesion(await iniciarSesion(email, password))
      navigate('/clientes', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      if (err instanceof ApiError) setErrores(err.errores)
      setEnviando(false)
    }
  }

  return (
    <PantallaAuth titulo="Qué bueno verte de nuevo" subtitulo="Entra y sigue llenando tu agenda.">
      {params.get('sesion') === 'expirada' && !error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu sesión venció. Inicia sesión de nuevo.
        </div>
      )}
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <AvisoError mensaje={error} />
        <Campo id="email" etiqueta="Correo" error={errores.email}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errores.email}
            className={claseInput}
          />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errores.password}
            className={claseInput}
          />
        </Campo>
        <Boton type="submit" cargando={enviando}>
          Entrar
        </Boton>
      </form>
      <p className="mt-8 text-center text-stone-600">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-marca-700 underline-offset-4 hover:underline">
          Registra tu negocio
        </Link>
      </p>
    </PantallaAuth>
  )
}
