import { create } from 'zustand'
import type { User } from '@/features/auth/types'

/**
 * La sesión vive en una cookie HttpOnly: JavaScript nunca ve el token.
 * Este store solo guarda el usuario actual, que se obtiene con GET /auth/me.
 *
 * - checking: todavía no se sabe si hay sesión (arranque de la app)
 * - authenticated: hay un usuario activo
 * - anonymous: no hay sesión
 */
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthState {
  user: User | null
  status: AuthStatus
  /** true si la sesión terminó porque el usuario salió (no por expiración). */
  loggedOut: boolean
  setUser: (user: User) => void
  clear: (opts?: { voluntary?: boolean }) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'checking',
  loggedOut: false,
  setUser: (user) => set({ user, status: 'authenticated', loggedOut: false }),
  clear: (opts) =>
    set({ user: null, status: 'anonymous', loggedOut: opts?.voluntary ?? false }),
}))
