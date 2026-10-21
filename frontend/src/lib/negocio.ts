import { useOutletContext } from 'react-router'
import type { Salon } from '../api/auth'

export interface ContextoNegocio {
  salon: Salon | null
}

/** El negocio de la sesión, para las pantallas que van dentro del Layout. */
export const useNegocio = () => useOutletContext<ContextoNegocio>()
