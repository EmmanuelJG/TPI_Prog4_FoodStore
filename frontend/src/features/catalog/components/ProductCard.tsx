import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { formatMoney } from '@/shared/utils/format'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import type { Producto } from '../types'

function stockLabel(p: Producto): { texto: string; clase: string } | null {
  if (!p.disponible) return { texto: 'No disponible', clase: 'bg-stone-200 text-stone-700' }
  if (p.stock === 0) return { texto: 'Sin stock', clase: 'bg-red-100 text-red-700' }
  if (p.stock <= 5) return { texto: `Últimas ${p.stock}`, clase: 'bg-amber-100 text-amber-800' }
  return null
}

export function ProductCard({ producto }: { producto: Producto }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const add = useCartStore((s) => s.add)
  const enCarrito = useCartStore(
    (s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0,
  )
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    if (!agregado) return
    const id = setTimeout(() => setAgregado(false), 1200)
    return () => clearTimeout(id)
  }, [agregado])

  const etiqueta = stockLabel(producto)
  const sinExistencias = !producto.disponible || producto.stock === 0
  const alLimite = enCarrito >= producto.stock

  function agregar() {
    add({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_base,
      imagen_url: producto.imagen_url,
      stock: producto.stock,
    })
    setAgregado(true)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-200">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center text-6xl font-bold text-brand-300"
          >
            {producto.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        {etiqueta && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${etiqueta.clase}`}
          >
            {etiqueta.texto}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
          {producto.categoria.nombre}
        </p>
        <h3 className="text-base font-semibold leading-snug">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="line-clamp-2 text-sm text-stone-600">{producto.descripcion}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="text-lg font-bold">{formatMoney(producto.precio_base)}</p>

          {user?.role === 'admin' ? null : !user ? (
            <Link
              to="/login"
              state={{ from: location.pathname + location.search }}
              className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900"
            >
              Ingresá para comprar
            </Link>
          ) : (
            <Button onClick={agregar} disabled={sinExistencias || alLimite}>
              {sinExistencias ? 'No disponible' : agregado ? 'Agregado ✓' : alLimite ? 'Máximo' : 'Agregar'}
            </Button>
          )}
        </div>

        {user?.role === 'user' && enCarrito > 0 && (
          <p className="text-xs text-stone-500">En tu carrito: {enCarrito}</p>
        )}
      </div>
    </article>
  )
}
