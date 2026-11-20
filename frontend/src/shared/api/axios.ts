import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { queryClient } from './queryClient'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  // Necesario para que el navegador envíe y reciba la cookie HttpOnly.
  withCredentials: true,
})

// Endpoints donde un 401 es una respuesta esperada (credenciales incorrectas
// o "todavía no hay sesión") y no significa que la sesión expiró.
const SIN_REDIRECCION = ['/auth/token', '/auth/me', '/auth/register']

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const esperado = SIN_REDIRECCION.some((ruta) => url.endsWith(ruta))
      if (!esperado && useAuthStore.getState().status === 'authenticated') {
        // Sesión expirada: se limpia el estado y ProtectedRoute redirige al login.
        useAuthStore.getState().clear()
        queryClient.clear()
      }
    }
    return Promise.reject(error)
  },
)
