// Validadores de TanStack Form: devuelven un mensaje de error o undefined.
// Reflejan las reglas del backend (UserCreate) para fallar antes de enviar.

type Validator = (props: { value: string }) => string | undefined

export const required =
  (mensaje: string): Validator =>
  ({ value }) =>
    value.trim() ? undefined : mensaje

export const username: Validator = ({ value }) => {
  const v = value.trim()
  if (!v) return 'El usuario es obligatorio'
  if (v.length < 3) return 'Mínimo 3 caracteres'
  if (v.length > 50) return 'Máximo 50 caracteres'
  return undefined
}

export const fullName: Validator = ({ value }) => {
  const v = value.trim()
  if (!v) return 'El nombre es obligatorio'
  if (v.length > 100) return 'Máximo 100 caracteres'
  return undefined
}

export const email: Validator = ({ value }) => {
  const v = value.trim()
  if (!v) return 'El email es obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresá un email válido'
  return undefined
}

export const password: Validator = ({ value }) => {
  if (!value) return 'La contraseña es obligatoria'
  if (value.length < 8) return 'Mínimo 8 caracteres'
  return undefined
}
