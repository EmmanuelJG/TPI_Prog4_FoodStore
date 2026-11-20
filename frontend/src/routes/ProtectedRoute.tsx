import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/features/auth/types'
import { Spinner } from '@/shared/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  /** Si se indica, solo esos roles acceden; el resto va a /unauthorized. */
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const loggedOut = useAuthStore((s) => s.loggedOut)
  const location = useLocation()

  if (status === 'checking') return <Spinner label="Verificando sesión…" />

  if (status === 'anonymous' || !user) {
    // Si el usuario salió a propósito no se recuerda la ruta: el próximo en
    // ingresar (otro rol, por ejemplo) no debe heredar la pantalla anterior.
    return (
      <Navigate
        to="/login"
        replace
        state={loggedOut ? undefined : { from: location.pathname }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
