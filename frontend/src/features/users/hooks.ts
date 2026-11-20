import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from './api'

export const userKeys = { all: ['usuarios'] as const }

export function useUsuarios() {
  return useQuery({ queryKey: userKeys.all, queryFn: usersApi.listar })
}

export function useCambiarActivoUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? usersApi.activar(id) : usersApi.desactivar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}
