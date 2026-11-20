import { api } from '@/shared/api/axios'
import type { LoginInput, RegisterInput, User } from './types'

export const authApi = {
  register: async (data: RegisterInput): Promise<User> => {
    const { data: user } = await api.post<User>('/auth/register', data)
    return user
  },

  // OAuth2PasswordRequestForm exige application/x-www-form-urlencoded.
  // El token queda en la cookie HttpOnly; el cuerpo solo trae un mensaje.
  login: async ({ username, password }: LoginInput): Promise<void> => {
    await api.post('/auth/token', new URLSearchParams({ username, password }))
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
