export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO'
export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA'

export interface DetallePedido {
  producto_id: number
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Pedido {
  id: number
  usuario_id: number
  estado: EstadoPedido
  forma_pago: FormaPago
  direccion_entrega: string
  notas: string | null
  total: number
  created_at: string
  updated_at: string
  items: DetallePedido[]
}

export interface PedidosPaginados {
  total: number
  items: Pedido[]
}

export interface CrearPedidoInput {
  items: { producto_id: number; cantidad: number }[]
  forma_pago: FormaPago
  direccion_entrega: string
  notas?: string | null
}

export interface PedidosParams {
  skip: number
  limit: number
  estado?: EstadoPedido
}

export interface ResumenPedidos {
  pendientes: number
  en_preparacion: number
  entregados: number
  cancelados: number
  pedidos_hoy: number
  ingresos_entregados: number
}

/** RN-02: transiciones válidas. Espejo del mapa del backend, solo para armar la UI. */
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
}

export const ESTADOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
}
