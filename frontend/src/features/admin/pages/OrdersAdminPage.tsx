import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useUsuarios } from '@/features/users/hooks'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DataTable } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { Spinner } from '@/shared/ui/Spinner'
import { formatFecha, formatMoney } from '@/shared/utils/format'
import { EstadoBadge } from '@/features/orders/components/EstadoBadge'
import { useCambiarEstadoPedido, usePedidos, useResumenPedidos } from '@/features/orders/hooks'
import {
  ESTADO_LABEL,
  ESTADOS,
  FORMA_PAGO_LABEL,
  TRANSICIONES,
  type EstadoPedido,
  type Pedido,
} from '@/features/orders/types'

const PAGE_SIZE = 10
const VACIO: Pedido[] = []

// Texto del botón según el estado al que se pasa.
const ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
}

function Tarjeta({ titulo, valor, destacada = false }: { titulo: string; valor: string; destacada?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destacada ? 'border-brand-200 bg-brand-50' : 'border-stone-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
    </div>
  )
}

export default function OrdersAdminPage() {
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)

  const pedidos = usePedidos({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    estado: estado || undefined,
  })
  const resumen = useResumenPedidos()
  const usuarios = useUsuarios()
  const cambiar = useCambiarEstadoPedido()

  const nombres = useMemo(
    () => new Map((usuarios.data ?? []).map((u) => [u.id, u.full_name])),
    [usuarios.data],
  )

  const total = pedidos.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function toggle(id: number) {
    setAbiertos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function pasarA(pedido: Pedido, nuevo: EstadoPedido) {
    if (nuevo === 'CANCELADO') {
      cambiar.reset()
      setACancelar(pedido)
      return
    }
    cambiar.mutate({ id: pedido.id, estado: nuevo })
  }

  function confirmarCancelacion() {
    if (!aCancelar) return
    cambiar.mutate(
      { id: aCancelar.id, estado: 'CANCELADO' },
      { onSuccess: () => setACancelar(null) },
    )
  }

  const columnas = useMemo<ColumnDef<Pedido, unknown>[]>(
    () => [
      {
        id: 'id',
        header: '#',
        cell: ({ row }) => <span className="font-semibold">#{row.original.id}</span>,
      },
      {
        id: 'cliente',
        header: 'Cliente',
        cell: ({ row }) =>
          nombres.get(row.original.usuario_id) ?? `Usuario #${row.original.usuario_id}`,
      },
      {
        id: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-stone-600">{formatFecha(row.original.created_at)}</span>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        cell: ({ row }) => <EstadoBadge estado={row.original.estado} />,
      },
      {
        id: 'pago',
        header: 'Pago',
        cell: ({ row }) => FORMA_PAGO_LABEL[row.original.forma_pago],
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">{formatMoney(row.original.total)}</span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => toggle(p.id)} className="!px-2 !py-1">
                {abiertos.has(p.id) ? 'Ocultar' : 'Detalle'}
              </Button>
              {TRANSICIONES[p.estado].map((siguiente) => (
                <Button
                  key={siguiente}
                  variant={siguiente === 'CANCELADO' ? 'danger' : 'primary'}
                  disabled={cambiar.isPending}
                  onClick={() => pasarA(p, siguiente)}
                  className="!px-3 !py-1"
                  aria-label={`${ACCION[siguiente]} pedido ${p.id}`}
                >
                  {ACCION[siguiente]}
                </Button>
              ))}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nombres, abiertos, cambiar.isPending],
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>

      {resumen.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" data-testid="resumen">
          <Tarjeta titulo="Pendientes" valor={String(resumen.data.pendientes)} destacada />
          <Tarjeta titulo="En preparación" valor={String(resumen.data.en_preparacion)} />
          <Tarjeta titulo="Entregados" valor={String(resumen.data.entregados)} />
          <Tarjeta titulo="Cancelados" valor={String(resumen.data.cancelados)} />
          <Tarjeta titulo="Pedidos hoy" valor={String(resumen.data.pedidos_hoy)} />
          <Tarjeta titulo="Ingresos" valor={formatMoney(resumen.data.ingresos_entregados)} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {total} {total === 1 ? 'pedido' : 'pedidos'}
        </p>
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

      {pedidos.isError && <Alert>{handleApiError(pedidos.error)}</Alert>}
      {cambiar.isError && !aCancelar && <Alert>{handleApiError(cambiar.error)}</Alert>}

      {pedidos.isPending ? (
        <Spinner label="Cargando pedidos…" />
      ) : (
        <>
          <DataTable
            data={pedidos.data?.items ?? VACIO}
            columns={columnas}
            getRowId={(p) => String(p.id)}
            empty="No hay pedidos"
            dimmed={pedidos.isPlaceholderData}
            isSubRowOpen={(p) => abiertos.has(p.id)}
            renderSubRow={(p) => (
              <div className="space-y-2 text-sm">
                <ul className="space-y-1">
                  {p.items.map((it) => (
                    <li key={it.producto_id} className="flex justify-between gap-4">
                      <span>
                        {it.cantidad} × {it.nombre_producto}{' '}
                        <span className="text-stone-400">({formatMoney(it.precio_unitario)} c/u)</span>
                      </span>
                      <span className="tabular-nums">{formatMoney(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-stone-200 pt-2 text-stone-600">
                  Entrega: {p.direccion_entrega}
                  {p.notas && <span className="block text-stone-400">Notas: {p.notas}</span>}
                </p>
              </div>
            )}
          />
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={aCancelar !== null}
        title={`Cancelar pedido #${aCancelar?.id ?? ''}`}
        message="Se restituirá el stock de todos los productos del pedido. Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        loading={cambiar.isPending}
        error={cambiar.isError ? handleApiError(cambiar.error) : undefined}
        onConfirm={confirmarCancelacion}
        onCancel={() => {
          cambiar.reset()
          setACancelar(null)
        }}
      />
    </div>
  )
}
