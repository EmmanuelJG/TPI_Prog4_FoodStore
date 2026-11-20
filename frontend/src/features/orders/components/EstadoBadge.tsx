import { ESTADO_LABEL, type EstadoPedido } from '../types'

const clases: Record<EstadoPedido, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  EN_PREPARACION: 'bg-sky-100 text-sky-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${clases[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  )
}
