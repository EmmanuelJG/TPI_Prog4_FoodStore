import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import CartPage from '@/features/cart/pages/CartPage'
import CatalogPage from '@/features/catalog/pages/CatalogPage'
import CheckoutPage from '@/features/orders/pages/CheckoutPage'
import MyOrdersPage from '@/features/orders/pages/MyOrdersPage'
import { Layout } from '@/shared/components/Layout'
import NotFoundPage from '@/shared/pages/NotFoundPage'
import UnauthorizedPage from '@/shared/pages/UnauthorizedPage'
import { Spinner } from '@/shared/ui/Spinner'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

// El panel de administración se descarga solo cuando entra un admin.
const OrdersAdminPage = lazy(() => import('@/features/admin/pages/OrdersAdminPage'))
const ProductsAdminPage = lazy(() => import('@/features/admin/pages/ProductsAdminPage'))
const CategoriesAdminPage = lazy(() => import('@/features/admin/pages/CategoriesAdminPage'))
const UsersAdminPage = lazy(() => import('@/features/admin/pages/UsersAdminPage'))

export function AppRouter() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Públicas */}
          <Route index element={<CatalogPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          {/* Solo sin sesión */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Cliente */}
          <Route element={<ProtectedRoute roles={['user']} />}>
            <Route path="carrito" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="pedidos" element={<MyOrdersPage />} />
          </Route>

          {/* Administración */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin/pedidos" element={<OrdersAdminPage />} />
            <Route path="admin/productos" element={<ProductsAdminPage />} />
            <Route path="admin/categorias" element={<CategoriesAdminPage />} />
            <Route path="admin/usuarios" element={<UsersAdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
