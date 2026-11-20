import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useEliminarProducto } from '@/features/catalog/adminHooks'
import { useCategorias, useProductos } from '@/features/catalog/hooks'
import type { Producto } from '@/features/catalog/types'
import { handleApiError } from '@/shared/api/errors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DataTable } from '@/shared/ui/DataTable'
import { Modal } from '@/shared/ui/Modal'
import { Pagination } from '@/shared/ui/Pagination'
import { Spinner } from '@/shared/ui/Spinner'
import { formatMoney } from '@/shared/utils/format'
import { ProductForm } from '../components/ProductForm'
import { StockForm } from '../components/StockForm'

const PAGE_SIZE = 10
const VACIO: Producto[] = []

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }
  | null

export default function ProductsAdminPage() {
  const [page, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const search = useDebounce(busqueda)

  const categorias = useCategorias()
  const productos = useProductos({ page, size: PAGE_SIZE, search, categoria_id: categoriaId })
  const eliminar = useEliminarProducto()

  const cerrar = () => {
    eliminar.reset()
    setDialogo(null)
  }

  const columnas = useMemo<ColumnDef<Producto, unknown>[]>(
    () => [
      {
        id: 'producto',
        header: 'Producto',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.nombre}</p>
            {row.original.descripcion && (
              <p className="max-w-xs truncate text-xs text-stone-500">{row.original.descripcion}</p>
            )}
          </div>
        ),
      },
      { id: 'categoria', header: 'Categoría', cell: ({ row }) => row.original.categoria.nombre },
      {
        id: 'precio',
        header: 'Precio',
        cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.precio_base)}</span>,
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <span
            className={`tabular-nums ${row.original.stock === 0 ? 'font-semibold text-red-600' : ''}`}
          >
            {row.original.stock}
          </span>
        ),
      },
      {
        id: 'disponible',
        header: 'Disponible',
        cell: ({ row }) =>
          row.original.disponible ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">Sí</span>
          ) : (
            <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700">No</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="!px-3 !py-1"
                onClick={() => setDialogo({ tipo: 'editar', producto: p })}
                aria-label={`Editar ${p.nombre}`}
              >
                Editar
              </Button>
              <Button
                variant="secondary"
                className="!px-3 !py-1"
                onClick={() => setDialogo({ tipo: 'stock', producto: p })}
                aria-label={`Ajustar stock de ${p.nombre}`}
              >
                Stock
              </Button>
              <Button
                variant="danger"
                className="!px-3 !py-1"
                onClick={() => setDialogo({ tipo: 'eliminar', producto: p })}
                aria-label={`Eliminar ${p.nombre}`}
              >
                Eliminar
              </Button>
            </div>
          )
        },
      },
    ],
    [],
  )

  const listaCategorias = categorias.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        <Button onClick={() => setDialogo({ tipo: 'crear' })}>Nuevo producto</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 sm:max-w-xs"
        />
        <select
          aria-label="Filtrar por categoría"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
            setPage(1)
          }}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="">Todas las categorías</option>
          {listaCategorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {productos.data && (
          <p className="text-sm text-stone-500 sm:ml-auto">
            {productos.data.total} {productos.data.total === 1 ? 'producto' : 'productos'}
          </p>
        )}
      </div>

      {productos.isError && <Alert>{handleApiError(productos.error)}</Alert>}

      {productos.isPending ? (
        <Spinner label="Cargando productos…" />
      ) : (
        <>
          <DataTable
            data={productos.data?.items ?? VACIO}
            columns={columnas}
            getRowId={(p) => String(p.id)}
            empty="No hay productos"
            dimmed={productos.isPlaceholderData}
          />
          <Pagination page={productos.data?.page ?? 1} pages={productos.data?.pages ?? 1} onChange={setPage} />
        </>
      )}

      <Modal
        open={dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'}
        title={dialogo?.tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        onClose={cerrar}
      >
        <ProductForm
          key={dialogo?.tipo === 'editar' ? dialogo.producto.id : 'nuevo'}
          producto={dialogo?.tipo === 'editar' ? dialogo.producto : undefined}
          categorias={listaCategorias}
          onDone={cerrar}
        />
      </Modal>

      <Modal open={dialogo?.tipo === 'stock'} title="Ajustar stock" onClose={cerrar}>
        {dialogo?.tipo === 'stock' && <StockForm producto={dialogo.producto} onDone={cerrar} />}
      </Modal>

      <ConfirmDialog
        open={dialogo?.tipo === 'eliminar'}
        title="Eliminar producto"
        message={`«${dialogo?.tipo === 'eliminar' ? dialogo.producto.nombre : ''}» dejará de mostrarse en el menú. Los pedidos anteriores conservan su detalle.`}
        confirmLabel="Eliminar"
        loading={eliminar.isPending}
        error={eliminar.isError ? handleApiError(eliminar.error) : undefined}
        onConfirm={() => {
          if (dialogo?.tipo === 'eliminar') eliminar.mutate(dialogo.producto.id, { onSuccess: cerrar })
        }}
        onCancel={cerrar}
      />
    </div>
  )
}
