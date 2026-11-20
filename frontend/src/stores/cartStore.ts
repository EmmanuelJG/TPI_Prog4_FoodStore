import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  producto_id: number
  nombre: string
  precio: number
  imagen_url: string | null
  cantidad: number
  /** Stock conocido al agregar; sirve para limitar la cantidad en pantalla. */
  stock: number
}

interface CartState {
  items: CartItem[]
  add: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => void
  setCantidad: (productoId: number, cantidad: number) => void
  remove: (productoId: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (item, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === item.producto_id)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id
                  ? {
                      ...i,
                      stock: item.stock,
                      cantidad: Math.min(i.cantidad + cantidad, item.stock),
                    }
                  : i,
              ),
            }
          }
          return {
            items: [...state.items, { ...item, cantidad: Math.min(cantidad, item.stock) }],
          }
        }),

      setCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.producto_id === productoId
                ? { ...i, cantidad: Math.min(cantidad, i.stock) }
                : i,
            )
            .filter((i) => i.cantidad > 0),
        })),

      remove: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'foodstore-cart' },
  ),
)

export const selectCartCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.cantidad, 0)

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
