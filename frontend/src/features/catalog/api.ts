import { api } from '@/shared/api/axios'
import type { Categoria, ProductosPaginados, ProductosParams } from './types'

export const catalogApi = {
  categorias: async (): Promise<Categoria[]> => {
    const { data } = await api.get<Categoria[]>('/categorias')
    return data
  },

  productos: async (params: ProductosParams): Promise<ProductosPaginados> => {
    const { data } = await api.get<ProductosPaginados>('/productos', {
      // Los filtros vacíos no se envían.
      params: {
        page: params.page,
        size: params.size,
        search: params.search || undefined,
        categoria_id: params.categoria_id,
      },
    })
    return data
  },
}
