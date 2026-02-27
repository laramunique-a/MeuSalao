import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types/models'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  usuario: Usuario | null
  isAuthenticated: boolean
  isAdmin: boolean
  setUser: (user: User | null, usuario: Usuario | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      usuario: null,
      isAuthenticated: false,
      isAdmin: false,
      setUser: (user, usuario) =>
        set({
          user,
          usuario,
          isAuthenticated: !!user,
          isAdmin: usuario?.perfil === 'administrador',
        }),
      logout: () =>
        set({
          user: null,
          usuario: null,
          isAuthenticated: false,
          isAdmin: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
