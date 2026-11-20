import { isAxiosError } from 'axios'

interface ValidationItem {
  loc?: (string | number)[]
  msg?: string
}

/**
 * Convierte cualquier error en un mensaje legible para el usuario.
 * El backend responde `{ detail: string }` (400, 401, 403, 404, 409)
 * o `{ detail: [{ loc, msg }] }` (422 de validación).
 */
export function handleApiError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.'
    }
    const detail: unknown = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return (detail as ValidationItem[])
        .map((item) => {
          const campo = item.loc?.filter((p) => p !== 'body').join('.')
          return campo ? `${campo}: ${item.msg}` : (item.msg ?? 'Dato inválido')
        })
        .join(' · ')
    }
    if (error.response.status >= 500) return 'Error interno del servidor. Probá de nuevo.'
    return 'Ocurrió un error inesperado.'
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}
