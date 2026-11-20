import { Link, NavLink } from 'react-router-dom'
import { useLogout } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { selectCartCount, useCartStore } from '@/stores/cartStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-100 text-brand-800' : 'text-stone-600 hover:bg-stone-200/70'
  }`

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const cartCount = useCartStore(selectCartCount)
  const logout = useLogout()
  const esAdmin = user?.role === 'admin'

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
        <Link to="/" className="mr-4 text-lg font-bold tracking-tight text-brand-700">
          Food Store
        </Link>

        <NavLink to="/" end className={linkClass}>
          Catálogo
        </NavLink>

        {user && !esAdmin && (
          <>
            <NavLink to="/pedidos" className={linkClass}>
              Mis pedidos
            </NavLink>
            <NavLink to="/carrito" className={linkClass}>
              Carrito
              {cartCount > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </NavLink>
          </>
        )}

        {esAdmin && (
          <>
            <NavLink to="/admin/pedidos" className={linkClass}>
              Pedidos
            </NavLink>
            <NavLink to="/admin/productos" className={linkClass}>
              Productos
            </NavLink>
            <NavLink to="/admin/categorias" className={linkClass}>
              Categorías
            </NavLink>
            <NavLink to="/admin/usuarios" className={linkClass}>
              Usuarios
            </NavLink>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-stone-600 sm:inline">
                {user.full_name}
                {esAdmin && (
                  <span className="ml-2 rounded bg-stone-800 px-1.5 py-0.5 text-xs font-semibold text-white">
                    admin
                  </span>
                )}
              </span>
              <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200/70"
              >
                Ingresar
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
