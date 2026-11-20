import { api } from '@/shared/api/axios'
import type { Categoria, Producto } from './types'

export interface ProductoInput {
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  categoria_id: number
}

export interface CategoriaInput {
  nombre: string
  descripcion: string | null
}

export const catalogAdminApi = {
  crearProducto: async (input: ProductoInput): Promise<Producto> => {
    const { data } = await api.post<Producto>('/productos', input)
    return data
  },

  actualizarProducto: async ({ id, ...input }: ProductoInput & { id: number }): Promise<Producto> => {
    const { data } = await api.put<Producto>(`/productos/${id}`, input)
    return data
  },

  actualizarStock: async ({
    id,
    ...cambios
  }: { id: number; stock: number; disponible: boolean }): Promise<Producto> => {
    const { data } = await api.patch<Producto>(`/productos/${id}/stock`, cambios)
    return data
  },

  eliminarProducto: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`)
  },

  crearCategoria: async (input: CategoriaInput): Promise<Categoria> => {
    const { data } = await api.post<Categoria>('/categorias', input)
    return data
  },

  actualizarCategoria: async ({ id, ...input }: CategoriaInput & { id: number }): Promise<Categoria> => {
    const { data } = await api.put<Categoria>(`/categorias/${id}`, input)
    return data
  },

  eliminarCategoria: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`)
  },
}
