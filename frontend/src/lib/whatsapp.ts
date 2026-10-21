import { formatearDiaLargo, formatearHora } from './formato'

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0]

/** Abre WhatsApp con el mensaje ya escrito. El teléfono es un celular colombiano de 10 dígitos. */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
}

export function mensajeRecordatorioCita(cliente: string, negocio: string, inicio: string): string {
  return `Hola ${primerNombre(cliente)} 👋 Te recordamos tu cita en ${negocio} el ${formatearDiaLargo(inicio)} a las ${formatearHora(inicio)}. ¡Te esperamos!`
}

export function mensajeLeTocaVolver(cliente: string, negocio: string): string {
  return `Hola ${primerNombre(cliente)} 👋 En ${negocio} te extrañamos: ya te toca tu próxima visita. ¿Te apartamos un espacio esta semana?`
}
