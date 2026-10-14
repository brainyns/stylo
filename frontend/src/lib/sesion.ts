const CLAVE_SESION = 'stylo.sesion'

export interface Sesion {
  token: string
  expiraEn: string
}

// TODO: en producción conviene revisar dónde se guarda el token. localStorage es accesible desde
// cualquier script de la página (riesgo ante XSS); evaluar cookie httpOnly + SameSite o un token de
// corta duración en memoria con refresh token.
export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION)
}

/** Devuelve el token si hay una sesión guardada y no ha vencido. */
export function obtenerToken(): string | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION)
    if (!guardada) return null
    const sesion = JSON.parse(guardada) as Sesion
    if (!sesion.token || new Date(sesion.expiraEn).getTime() <= Date.now()) {
      borrarSesion()
      return null
    }
    return sesion.token
  } catch {
    return null
  }
}
