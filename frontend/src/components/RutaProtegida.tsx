import { Navigate, Outlet } from 'react-router'
import { obtenerToken } from '../lib/sesion'

export function RutaProtegida() {
  return obtenerToken() ? <Outlet /> : <Navigate to="/login" replace />
}

/** Para /login y /registro: si ya hay sesión, va directo a las clientas. */
export function SoloSinSesion() {
  return obtenerToken() ? <Navigate to="/clientas" replace /> : <Outlet />
}
