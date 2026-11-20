import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/shared/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

/** Login y registro: si ya hay sesión, se redirige a donde iba o según el rol. */
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (status === 'checking') return <Spinner label="Verificando sesión…" />

  if (status === 'authenticated' && user) {
    const from = (location.state as { from?: string } | null)?.from
    const destino = from ?? (user.role === 'admin' ? '/admin/pedidos' : '/')
    return <Navigate to={destino} replace />
  }
  return <Outlet />
}
