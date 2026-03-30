import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'

export function useAuth() {
  const { user, usuario, isAuthenticated, isAdmin, isSuperAdmin } = useAuthStore()

  useEffect(() => {
    authService.getCurrentUser()
  }, [])

  return {
    user,
    usuario,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    login: authService.login,
    logout: authService.logout,
    resetPassword: authService.resetPassword,
  }
}
