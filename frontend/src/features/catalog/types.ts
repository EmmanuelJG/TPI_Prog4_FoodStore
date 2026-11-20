export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  activo: boolean
  categoria_id: number
  categoria: Categoria
}

export interface ProductosPaginados {
  total: number
  items: Producto[]
  page: number
  size: number
  pages: number
}

export interface ProductosParams {
  page: number
  size: number
  search?: string
  categoria_id?: number
}
