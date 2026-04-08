import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export const clienteService = {
  async getAll() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('salao_id', usuario.salao_id)
      .order('nome', { ascending: true })

    if (error) throw error
    return data as Cliente[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('id', id)
      .single<Cliente>()

    if (error) throw error
    return data
  },

  async create(cliente: Omit<Cliente, 'id' | 'salao_id' | 'created_at' | 'updated_at'>) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('cliente') as any)
      .insert({
        ...cliente,
        salao_id: usuario.salao_id,
      })
      .select()
      .single()

    if (error) throw error
    return data as unknown as Cliente
  },

  async update(id: string, cliente: Partial<Cliente>) {
    const { data, error } = await (supabase
      .from('cliente') as any)
      .update(cliente)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Cliente
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('cliente')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async search(termo: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('salao_id', usuario.salao_id)
      .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,email.ilike.%${termo}%`)
      .order('nome', { ascending: true })

    if (error) throw error
    return data as Cliente[]
  },
}
