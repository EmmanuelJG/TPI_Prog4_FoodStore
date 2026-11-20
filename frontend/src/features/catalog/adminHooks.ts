import { useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogAdminApi } from './adminApi'
import { catalogKeys } from './hooks'

/** Los productos embeben su categoría, así que ambas listas se refrescan juntas. */
function useInvalidarCatalogo() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: catalogKeys.productos })
    void qc.invalidateQueries({ queryKey: catalogKeys.categorias })
  }
}

export function useCrearProducto() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.crearProducto, onSuccess: invalidar })
}

export function useActualizarProducto() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.actualizarProducto, onSuccess: invalidar })
}

export function useActualizarStock() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.actualizarStock, onSuccess: invalidar })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.eliminarProducto, onSuccess: invalidar })
}

export function useCrearCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.crearCategoria, onSuccess: invalidar })
}

export function useActualizarCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.actualizarCategoria, onSuccess: invalidar })
}

export function useEliminarCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({ mutationFn: catalogAdminApi.eliminarCategoria, onSuccess: invalidar })
}
