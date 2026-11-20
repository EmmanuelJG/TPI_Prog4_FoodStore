import { api } from '@/shared/api/axios'
import type {
  CrearPedidoInput,
  EstadoPedido,
  Pedido,
  PedidosPaginados,
  PedidosParams,
  ResumenPedidos,
} from './types'

export const ordersApi = {
  crear: async (input: CrearPedidoInput): Promise<Pedido> => {
    const { data } = await api.post<Pedido>('/pedidos', input)
    return data
  },

  listar: async (params: PedidosParams): Promise<PedidosPaginados> => {
    const { data } = await api.get<PedidosPaginados>('/pedidos', { params })
    return data
  },

  cancelar: async (id: number): Promise<Pedido> => {
    const { data } = await api.patch<Pedido>(`/pedidos/${id}/cancelar`)
    return data
  },

  // --- solo admin ---

  cambiarEstado: async ({ id, estado }: { id: number; estado: EstadoPedido }): Promise<Pedido> => {
    const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })
    return data
  },

  resumen: async (): Promise<ResumenPedidos> => {
    const { data } = await api.get<ResumenPedidos>('/pedidos/resumen')
    return data
  },
}
