import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Fragment, type ReactNode } from 'react'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  getRowId: (row: T) => string
  empty?: string
  /** Fila extra bajo la fila principal (por ejemplo, el detalle de un pedido). */
  renderSubRow?: (row: T) => ReactNode
  isSubRowOpen?: (row: T) => boolean
  dimmed?: boolean
}

/** Tabla presentacional sobre TanStack Table. La paginación la maneja el padre. */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  empty = 'Sin resultados',
  renderSubRow,
  isSubRowOpen,
  dimmed = false,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-stone-200 bg-white ${
        dimmed ? 'opacity-60 transition-opacity' : ''
      }`}
    >
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-medium">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-stone-100">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-stone-500">
                {empty}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="hover:bg-stone-50/60" data-testid="fila">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {renderSubRow && isSubRowOpen?.(row.original) && (
                  <tr className="bg-stone-50/70">
                    <td colSpan={columns.length} className="px-4 py-3">
                      {renderSubRow(row.original)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
