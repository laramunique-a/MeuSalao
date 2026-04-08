import { supabase } from '@/lib/supabase'
import type { Servico } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export const servicoService = {
  async getAll() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('servico')
      .select('*')
      .eq('salao_id', usuario.salao_id)
      .order('nome', { ascending: true })

    if (error) throw error
    return data as Servico[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('servico')
      .select('*')
      .eq('id', id)
      .single<Servico>()

    if (error) throw error
    return data
  },

  async create(servico: Omit<Servico, 'id' | 'salao_id' | 'created_at' | 'updated_at'>) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('servico') as any)
      .insert({
        ...servico,
        salao_id: usuario.salao_id,
      })
      .select()
      .single()

    if (error) throw error
    return data as unknown as Servico
  },

  async update(id: string, servico: Partial<Servico>) {
    const { data, error } = await (supabase
      .from('servico') as any)
      .update(servico)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Servico
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('servico')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleAtivo(id: string, ativo: boolean) {
    const { data, error } = await (supabase
      .from('servico') as any)
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
