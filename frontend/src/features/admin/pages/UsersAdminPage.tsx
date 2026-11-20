import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { User } from '@/features/auth/types'
import { useCambiarActivoUsuario, useUsuarios } from '@/features/users/hooks'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { Spinner } from '@/shared/ui/Spinner'
import { formatFecha } from '@/shared/utils/format'
import { useAuthStore } from '@/stores/authStore'

const VACIO: User[] = []

export default function UsersAdminPage() {
  const yo = useAuthStore((s) => s.user)
  const usuarios = useUsuarios()
  const cambiar = useCambiarActivoUsuario()

  const columnas = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      { id: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.full_name}</span> },
      { id: 'username', header: 'Usuario', cell: ({ row }) => row.original.username },
      { id: 'email', header: 'Email', cell: ({ row }) => row.original.email },
      {
        id: 'rol',
        header: 'Rol',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              row.original.role === 'admin' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {row.original.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Desactivado</span>
          ) : (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">Activo</span>
          ),
      },
      {
        id: 'alta',
        header: 'Alta',
        cell: ({ row }) => <span className="whitespace-nowrap text-stone-600">{formatFecha(row.original.created_at)}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const u = row.original
          const esYo = u.id === yo?.id
          return u.disabled ? (
            <Button
              variant="secondary"
              className="!px-3 !py-1"
              disabled={cambiar.isPending}
              onClick={() => cambiar.mutate({ id: u.id, activar: true })}
              aria-label={`Activar a ${u.username}`}
            >
              Activar
            </Button>
          ) : (
            <Button
              variant="danger"
              className="!px-3 !py-1"
              disabled={esYo || cambiar.isPending}
              title={esYo ? 'No podés desactivar tu propia cuenta' : undefined}
              onClick={() => cambiar.mutate({ id: u.id, activar: false })}
              aria-label={`Desactivar a ${u.username}`}
            >
              Desactivar
            </Button>
          )
        },
      },
    ],
    [yo?.id, cambiar],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-stone-500">
          Un usuario desactivado no puede iniciar sesión. No se eliminan: es una baja lógica.
        </p>
      </div>

      {usuarios.isError && <Alert>{handleApiError(usuarios.error)}</Alert>}
      {cambiar.isError && <Alert>{handleApiError(cambiar.error)}</Alert>}

      {usuarios.isPending ? (
        <Spinner label="Cargando usuarios…" />
      ) : (
        <DataTable
          data={usuarios.data ?? VACIO}
          columns={columnas}
          getRowId={(u) => String(u.id)}
          empty="No hay usuarios"
        />
      )}
    </div>
  )
}
