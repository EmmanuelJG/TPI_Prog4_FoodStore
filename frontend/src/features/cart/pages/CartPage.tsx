import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { formatMoney } from '@/shared/utils/format'
import { selectCartTotal, useCartStore } from '@/stores/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const total = useCartStore(selectCartTotal)
  const setCantidad = useCartStore((s) => s.setCantidad)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="mt-2 text-stone-600">Agregá productos del menú para armar tu pedido.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Ver el menú
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tu carrito</h1>
        <Button variant="ghost" onClick={clear}>
          Vaciar carrito
        </Button>
      </div>

      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {items.map((item) => (
          <li
            key={item.producto_id}
            className="flex flex-wrap items-center gap-4 p-4"
            data-testid="cart-item"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{item.nombre}</p>
              <p className="text-sm text-stone-500">{formatMoney(item.precio)} c/u</p>
            </div>

            <div className="flex items-center gap-2" role="group" aria-label={`Cantidad de ${item.nombre}`}>
              <Button
                variant="secondary"
                className="size-9 !px-0"
                aria-label={`Quitar una unidad de ${item.nombre}`}
                onClick={() => setCantidad(item.producto_id, item.cantidad - 1)}
              >
                −
              </Button>
              <span className="w-8 text-center font-semibold tabular-nums">{item.cantidad}</span>
              <Button
                variant="secondary"
                className="size-9 !px-0"
                aria-label={`Agregar una unidad de ${item.nombre}`}
                disabled={item.cantidad >= item.stock}
                onClick={() => setCantidad(item.producto_id, item.cantidad + 1)}
              >
                +
              </Button>
            </div>

            <p className="w-28 text-right font-semibold tabular-nums">
              {formatMoney(item.precio * item.cantidad)}
            </p>

            <Button
              variant="ghost"
              aria-label={`Quitar ${item.nombre} del carrito`}
              onClick={() => remove(item.producto_id)}
            >
              Quitar
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-end gap-4 rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-lg">
          Total: <span className="text-2xl font-bold">{formatMoney(total)}</span>
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"
          >
            Seguir comprando
          </Link>
          <Button onClick={() => navigate('/checkout')}>Continuar</Button>
        </div>
      </div>
    </div>
  )
}
