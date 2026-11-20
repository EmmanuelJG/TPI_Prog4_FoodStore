import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { handleApiError } from '@/shared/api/errors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Alert } from '@/shared/ui/Alert'
import { Pagination } from '@/shared/ui/Pagination'
import { Spinner } from '@/shared/ui/Spinner'
import { ProductCard } from '../components/ProductCard'
import { useCategorias, useProductos } from '../hooks'

const PAGE_SIZE = 6

export default function CatalogPage() {
  // Los filtros viven en la URL: se pueden compartir y sobreviven a recargar.
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const categoriaId = Number(params.get('categoria')) || undefined
  const searchUrl = params.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(searchUrl)
  const searchDebounced = useDebounce(searchInput)

  // Se aplica la búsqueda a la URL una vez que el usuario dejó de escribir.
  useEffect(() => {
    if (searchDebounced === searchUrl) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (searchDebounced) next.set('search', searchDebounced)
        else next.delete('search')
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [searchDebounced, searchUrl, setParams])

  const categorias = useCategorias()
  const productos = useProductos({
    page,
    size: PAGE_SIZE,
    search: searchUrl,
    categoria_id: categoriaId,
  })

  function cambiarParam(clave: string, valor: string | null) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (valor) next.set(clave, valor)
      else next.delete(clave)
      if (clave !== 'page') next.delete('page')
      return next
    })
  }

  const hayFiltros = Boolean(categoriaId || searchUrl)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Nuestro menú</h1>
        <p className="text-stone-600">Elegí tus platos y pedí en minutos.</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            onClick={() => cambiarParam('categoria', null)}
            aria-pressed={!categoriaId}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              !categoriaId
                ? 'bg-brand-600 text-white'
                : 'bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100'
            }`}
          >
            Todas
          </button>
          {categorias.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => cambiarParam('categoria', String(c.id))}
              aria-pressed={categoriaId === c.id}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                categoriaId === c.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {productos.isError && <Alert>{handleApiError(productos.error)}</Alert>}

      {productos.isPending ? (
        <Spinner label="Cargando productos…" />
      ) : productos.data && productos.data.items.length > 0 ? (
        <>
          <p className="text-sm text-stone-500">
            {productos.data.total} {productos.data.total === 1 ? 'producto' : 'productos'}
          </p>
          <div
            className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
              productos.isPlaceholderData ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {productos.data.items.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
          <Pagination
            page={productos.data.page}
            pages={productos.data.pages}
            onChange={(p) => cambiarParam('page', String(p))}
          />
        </>
      ) : (
        !productos.isError && (
          <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
            <p className="font-medium">No encontramos productos</p>
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setParams({}, { replace: true })
                }}
                className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
              >
                Quitar filtros
              </button>
            )}
          </div>
        )
      )}
    </div>
  )
}
