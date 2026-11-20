import { useEffect } from 'react'
import { authApi } from '@/features/auth/api'
import { AppRouter } from '@/routes/AppRouter'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const clear = useAuthStore((s) => s.clear)

  // Al arrancar, la cookie HttpOnly decide si hay sesión: se pregunta al backend.
  useEffect(() => {
    let activo = true
    authApi
      .me()
      .then((user) => activo && setUser(user))
      .catch(() => activo && clear())
    return () => {
      activo = false
    }
  }, [setUser, clear])

  return <AppRouter />
}
