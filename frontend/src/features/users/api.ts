import { api } from '@/shared/api/axios'
import type { User } from '@/features/auth/types'

export const usersApi = {
  listar: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/admin/usuarios')
    return data
  },

  activar: async (id: number): Promise<User> => {
    const { data } = await api.post<User>(`/admin/usuarios/${id}/activar`)
    return data
  },

  desactivar: async (id: number): Promise<User> => {
    const { data } = await api.post<User>(`/admin/usuarios/${id}/desactivar`)
    return data
  },
}
