import { supabase } from '@/lib/supabase'
import type { Salao } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export const salaoService = {
  async getSalao(): Promise<Salao | null> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('salao')
      .select('*')
      .eq('id', usuario.salao_id)
      .single()

    if (error) throw error
    return data as Salao
  },

  async updateSalao(updates: Partial<Salao>): Promise<Salao> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('salao') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', usuario.salao_id)
      .select()
      .single()

    if (error) throw error
    return data as Salao
  },
}
