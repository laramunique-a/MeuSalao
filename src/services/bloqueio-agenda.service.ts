import { supabase } from '@/lib/supabase'
import type { BloqueioAgenda } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export const bloqueioAgendaService = {
  async getAll(): Promise<BloqueioAgenda[]> {
    const { data, error } = await supabase
      .from('bloqueio_agenda')
      .select(`
        *,
        profissional:usuario!profissional_id(id, nome, email)
      `)
      .order('data_inicio', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as unknown as BloqueioAgenda[]
  },

  async getByProfissionalAndDateRange(
    profissionalId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<BloqueioAgenda[]> {
    const { data, error } = await supabase
      .from('bloqueio_agenda')
      .select(`
        *,
        profissional:usuario!profissional_id(id, nome, email)
      `)
      .eq('profissional_id', profissionalId)
      .lte('data_inicio', dataFim)
      .gte('data_fim', dataInicio)

    if (error) throw new Error(error.message)
    return (data || []) as unknown as BloqueioAgenda[]
  },

  async getByDateRange(
    dataInicio: string,
    dataFim: string
  ): Promise<BloqueioAgenda[]> {
    const { data, error } = await supabase
      .from('bloqueio_agenda')
      .select(`
        *,
        profissional:usuario!profissional_id(id, nome, email)
      `)
      .lte('data_inicio', dataFim)
      .gte('data_fim', dataInicio)

    if (error) throw new Error(error.message)
    return (data || []) as unknown as BloqueioAgenda[]
  },

  async create(bloqueio: Omit<BloqueioAgenda, 'id' | 'created_at' | 'updated_at' | 'profissional'>): Promise<BloqueioAgenda> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('bloqueio_agenda') as any)
      .insert({
        ...bloqueio,
        salao_id: usuario.salao_id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as BloqueioAgenda
  },

  async update(id: string, bloqueio: Partial<BloqueioAgenda>): Promise<BloqueioAgenda> {
    const { profissional, ...updateData } = bloqueio

    const { data, error } = await (supabase
      .from('bloqueio_agenda') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as BloqueioAgenda
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('bloqueio_agenda').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async checkBloqueio(
    profissionalId: string,
    dataHora: string,
    duracaoMinutos: number = 30
  ): Promise<boolean> {
    const slotStart = new Date(dataHora)
    const slotEnd = new Date(slotStart.getTime() + duracaoMinutos * 60000)

    try {
      const { data: bloqueios, error } = await (supabase
        .from('bloqueio_agenda') as any)
        .select('*')
        .eq('profissional_id', profissionalId)
        .lte('data_inicio', slotEnd.toISOString())
        .gte('data_fim', slotStart.toISOString())

      if (error) {
        if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          return false
        }
        throw new Error(error.message)
      }

      return (bloqueios || []).some((b: any) => {
        const blockStart = new Date(b.data_inicio).getTime()
        const blockEnd = new Date(b.data_fim).getTime()
        const sStart = slotStart.getTime()
        const sEnd = slotEnd.getTime()
        return sStart < blockEnd && sEnd > blockStart
      })
    } catch (error) {
      console.error('Erro ao verificar bloqueio de agenda:', error)
      return false
    }
  },
}
