import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { authApi } from './api'
import type { LoginInput, RegisterInput } from './types'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      await authApi.login(input)
      return authApi.me()
    },
    onSuccess: (user) => setUser(user),
  })
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await authApi.register(input)
      // Tras registrarse se inicia sesión automáticamente.
      await authApi.login({ username: input.username, password: input.password })
      return authApi.me()
    },
    onSuccess: (user) => setUser(user),
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const clearCart = useCartStore((s) => s.clear)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Aunque falle la llamada, se cierra la sesión del lado del cliente.
      clear({ voluntary: true })
      clearCart()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}
