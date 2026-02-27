import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Usuario } from '@/types/models'

export const authService = {
  async verifyCredentials(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return true
  },

  async login(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('ativo', true)
      .single<Usuario>()

    if (usuarioError) throw usuarioError

    useAuthStore.getState().setUser(authData.user, usuario)

    return { user: authData.user, usuario }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    useAuthStore.getState().logout()
  },

  async getCurrentUser() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      useAuthStore.getState().logout()
      return null
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('ativo', true)
      .single<Usuario>()

    if (usuarioError) {
      useAuthStore.getState().logout()
      return null
    }

    useAuthStore.getState().setUser(user, usuario)

    return { user, usuario }
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },
}
