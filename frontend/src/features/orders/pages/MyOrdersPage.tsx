import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Pagination } from '@/shared/ui/Pagination'
import { Spinner } from '@/shared/ui/Spinner'
import { formatFecha, formatMoney } from '@/shared/utils/format'
import { EstadoBadge } from '../components/EstadoBadge'
import { useCancelarPedido, usePedidos } from '../hooks'
import { ESTADO_LABEL, ESTADOS, FORMA_PAGO_LABEL, type EstadoPedido, type Pedido } from '../types'

const PAGE_SIZE = 5

export default function MyOrdersPage() {
  const location = useLocation()
  const nuevoPedido = (location.state as { nuevoPedido?: number } | null)?.nuevoPedido

  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)

  const pedidos = usePedidos({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    estado: estado || undefined,
  })
  const cancelar = useCancelarPedido()

  const total = pedidos.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function confirmarCancelacion() {
    if (!aCancelar) return
    cancelar.mutate(aCancelar.id, { onSuccess: () => setACancelar(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Mis pedidos</h1>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          Estado
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoPedido | '')
              setPage(1)
            }}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nuevoPedido && <Alert tone="success">¡Listo! Tu pedido #{nuevoPedido} fue creado.</Alert>}
      {pedidos.isError && <Alert>{handleApiError(pedidos.error)}</Alert>}

      {pedidos.isPending ? (
        <Spinner label="Cargando pedidos…" />
      ) : pedidos.data && pedidos.data.items.length > 0 ? (
        <>
          <ul className="space-y-4">
            {pedidos.data.items.map((p) => (
              <li
                key={p.id}
                data-testid="pedido"
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stone-100 bg-stone-50 px-5 py-3">
                  <p className="font-semibold">Pedido #{p.id}</p>
                  <p className="text-sm text-stone-500">{formatFecha(p.created_at)}</p>
                  <EstadoBadge estado={p.estado} />
                  <p className="ml-auto text-lg font-bold">{formatMoney(p.total)}</p>
                </div>

                <div className="space-y-3 px-5 py-4">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-stone-400">
                      <tr>
                        <th className="pb-2 font-medium">Producto</th>
                        <th className="pb-2 text-right font-medium">Cant.</th>
                        <th className="hidden pb-2 text-right font-medium sm:table-cell">Precio</th>
                        <th className="pb-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {p.items.map((it) => (
                        <tr key={it.producto_id}>
                          <td className="py-2">{it.nombre_producto}</td>
                          <td className="py-2 text-right tabular-nums">{it.cantidad}</td>
                          <td className="hidden py-2 text-right tabular-nums sm:table-cell">
                            {formatMoney(it.precio_unitario)}
                          </td>
                          <td className="py-2 text-right tabular-nums">{formatMoney(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-stone-600">
                    <p>
                      {FORMA_PAGO_LABEL[p.forma_pago]} · {p.direccion_entrega}
                      {p.notas && <span className="block text-stone-400">Notas: {p.notas}</span>}
                    </p>
                    {p.estado === 'PENDIENTE' && (
                      <Button variant="danger" onClick={() => setACancelar(p)}>
                        Cancelar pedido
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      ) : (
        !pedidos.isError && (
          <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
            <p className="font-medium">
              {estado ? 'No hay pedidos con ese estado' : 'Todavía no hiciste pedidos'}
            </p>
            {!estado && (
              <Link to="/" className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
                Ver el menú
              </Link>
            )}
          </div>
        )
      )}

      <ConfirmDialog
        open={aCancelar !== null}
        title={`Cancelar pedido #${aCancelar?.id ?? ''}`}
        message="Se devolverá el stock de los productos y el pedido no podrá reactivarse."
        confirmLabel="Sí, cancelar"
        loading={cancelar.isPending}
        error={cancelar.isError ? handleApiError(cancelar.error) : undefined}
        onConfirm={confirmarCancelacion}
        onCancel={() => {
          cancelar.reset()
          setACancelar(null)
        }}
      />
    </div>
  )
}
