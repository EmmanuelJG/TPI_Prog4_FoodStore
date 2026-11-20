import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useEliminarCategoria } from '@/features/catalog/adminHooks'
import { useCategorias } from '@/features/catalog/hooks'
import type { Categoria } from '@/features/catalog/types'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DataTable } from '@/shared/ui/DataTable'
import { Modal } from '@/shared/ui/Modal'
import { Spinner } from '@/shared/ui/Spinner'
import { CategoryForm } from '../components/CategoryForm'

const VACIO: Categoria[] = []

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; categoria: Categoria }
  | { tipo: 'eliminar'; categoria: Categoria }
  | null

export default function CategoriesAdminPage() {
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const categorias = useCategorias()
  const eliminar = useEliminarCategoria()

  const cerrar = () => {
    eliminar.reset()
    setDialogo(null)
  }

  const columnas = useMemo<ColumnDef<Categoria, unknown>[]>(
    () => [
      { id: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      {
        id: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-stone-600">{row.original.descripcion ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="!px-3 !py-1"
              onClick={() => setDialogo({ tipo: 'editar', categoria: row.original })}
              aria-label={`Editar ${row.original.nombre}`}
            >
              Editar
            </Button>
            <Button
              variant="danger"
              className="!px-3 !py-1"
              onClick={() => setDialogo({ tipo: 'eliminar', categoria: row.original })}
              aria-label={`Eliminar ${row.original.nombre}`}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="mt-1 text-sm text-stone-500">
            Eliminar una categoría es una baja lógica: sus productos siguen visibles y el nombre no se libera.
          </p>
        </div>
        <Button onClick={() => setDialogo({ tipo: 'crear' })}>Nueva categoría</Button>
      </div>

      {categorias.isError && <Alert>{handleApiError(categorias.error)}</Alert>}

      {categorias.isPending ? (
        <Spinner label="Cargando categorías…" />
      ) : (
        <DataTable
          data={categorias.data ?? VACIO}
          columns={columnas}
          getRowId={(c) => String(c.id)}
          empty="No hay categorías"
        />
      )}

      <Modal
        open={dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'}
        title={dialogo?.tipo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        onClose={cerrar}
      >
        <CategoryForm
          key={dialogo?.tipo === 'editar' ? dialogo.categoria.id : 'nueva'}
          categoria={dialogo?.tipo === 'editar' ? dialogo.categoria : undefined}
          onDone={cerrar}
        />
      </Modal>

      <ConfirmDialog
        open={dialogo?.tipo === 'eliminar'}
        title="Eliminar categoría"
        message={`«${dialogo?.tipo === 'eliminar' ? dialogo.categoria.nombre : ''}» dejará de mostrarse. Sus productos no se ocultan.`}
        confirmLabel="Eliminar"
        loading={eliminar.isPending}
        error={eliminar.isError ? handleApiError(eliminar.error) : undefined}
        onConfirm={() => {
          if (dialogo?.tipo === 'eliminar') eliminar.mutate(dialogo.categoria.id, { onSuccess: cerrar })
        }}
        onCancel={cerrar}
      />
    </div>
  )
}
