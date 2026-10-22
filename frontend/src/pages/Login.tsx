import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { iniciarSesion } from '../api/auth'
import { ApiError } from '../api/client'
import { PantallaAuth } from '../components/PantallaAuth'
import { AvisoError, Boton, Campo, claseInput } from '../components/ui'
import { guardarSesion } from '../lib/sesion'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Revisa lo obvio antes de llamar al backend, para no esperar una respuesta que ya sabemos. */
function validar(email: string, password: string): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!email.trim()) errores.email = 'Escribe tu correo.'
  else if (!EMAIL_VALIDO.test(email.trim())) errores.email = 'Revisa el correo, parece incompleto (ej. nombre@correo.com).'
  if (!password) errores.password = 'Escribe tu contraseña.'
  return errores
}

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const refEmail = useRef<HTMLInputElement>(null)
  const refPassword = useRef<HTMLInputElement>(null)

  function mostrarErrores(campos: Record<string, string>) {
    setErrores(campos)
    if (campos.email) refEmail.current?.focus()
    else if (campos.password) refPassword.current?.focus()
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const invalidos = validar(email, password)
    if (Object.keys(invalidos).length > 0) {
      mostrarErrores(invalidos)
      return
    }
    setErrores({})
    setEnviando(true)
    try {
      guardarSesion(await iniciarSesion(email.trim(), password))
      navigate('/inicio', { replace: true })
    } catch (err) {
      setEnviando(false)
      if (err instanceof ApiError && err.status === 401) {
        // Correo o contraseña incorrectos: se deja el correo y se vuelve a la contraseña
        setError('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.')
        setPassword('')
        refPassword.current?.focus()
        return
      }
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      if (err instanceof ApiError) mostrarErrores(err.errores)
    }
  }

  const revisarMayusculas = (e: KeyboardEvent<HTMLInputElement>) => setMayusculas(e.getModifierState('CapsLock'))

  return (
    <PantallaAuth titulo="Qué bueno verte de nuevo" subtitulo="Entra y sigue llenando tu agenda.">
      {params.get('sesion') === 'expirada' && !error && (
        <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu sesión venció. Inicia sesión de nuevo.
        </div>
      )}
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <AvisoError mensaje={error} />
        <Campo id="email" etiqueta="Correo" error={errores.email}>
          <input
            ref={refEmail}
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="nombre@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errores.email}
            aria-describedby={errores.email ? 'email-error' : undefined}
            className={claseInput}
          />
        </Campo>
        <Campo
          id="password"
          etiqueta="Contraseña"
          error={errores.password}
          ayuda={mayusculas ? 'Tienes las mayúsculas activadas.' : undefined}
        >
          <div className="relative">
            <input
              ref={refPassword}
              id="password"
              type={verPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={revisarMayusculas}
              onBlur={() => setMayusculas(false)}
              aria-invalid={!!errores.password}
              aria-describedby={errores.password ? 'password-error' : undefined}
              className={`${claseInput} pr-24`}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-pressed={verPassword}
              className="absolute inset-y-1 right-1 rounded-lg px-3 text-sm font-semibold text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-marca-600"
            >
              {verPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </Campo>
        <Boton type="submit" cargando={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
      <p className="mt-8 border-t border-stone-200 pt-6 text-center text-stone-600">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-marca-700 underline-offset-4 hover:underline">
          Registra tu negocio
        </Link>
      </p>
    </PantallaAuth>
  )
}
