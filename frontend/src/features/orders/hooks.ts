import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogKeys } from '@/features/catalog/hooks'
import { ordersApi } from './api'
import type { PedidosParams } from './types'

export const orderKeys = {
  all: ['pedidos'] as const,
  list: (params: PedidosParams) => ['pedidos', 'list', params] as const,
  resumen: ['pedidos', 'resumen'] as const,
}

/** El backend devuelve solo los pedidos propios al cliente y todos al admin. */
export function usePedidos(params: PedidosParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.listar(params),
    placeholderData: keepPreviousData,
  })
}

export function useResumenPedidos() {
  return useQuery({
    queryKey: orderKeys.resumen,
    queryFn: ordersApi.resumen,
  })
}

/** Crear, cancelar o cambiar de estado modifica pedidos y stock: se refresca todo. */
function useInvalidarPedidosYStock() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: orderKeys.all })
    void qc.invalidateQueries({ queryKey: catalogKeys.productos })
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({ mutationFn: ordersApi.crear, onSuccess: invalidar })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({ mutationFn: ordersApi.cancelar, onSuccess: invalidar })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({ mutationFn: ordersApi.cambiarEstado, onSuccess: invalidar })
}
