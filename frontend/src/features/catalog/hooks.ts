import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'
import type { ProductosParams } from './types'

export const catalogKeys = {
  categorias: ['categorias'] as const,
  productos: ['productos'] as const,
  productosList: (params: ProductosParams) => ['productos', 'list', params] as const,
}

export function useCategorias() {
  return useQuery({
    queryKey: catalogKeys.categorias,
    queryFn: catalogApi.categorias,
    staleTime: 5 * 60_000,
  })
}

export function useProductos(params: ProductosParams) {
  return useQuery({
    queryKey: catalogKeys.productosList(params),
    queryFn: () => catalogApi.productos(params),
    // Mantiene la página anterior en pantalla mientras carga la siguiente.
    placeholderData: keepPreviousData,
  })
}
