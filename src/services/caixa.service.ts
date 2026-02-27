import { supabase } from '@/lib/supabase'
import type { TransacaoCaixa } from '@/types/models'
import { useAuthStore } from '@/store/authStore'
import { agendamentoService } from './agendamento.service'

const TRANSACAO_SELECT = `
  *,
  usuario:usuario_id (id, nome),
  agendamento:agendamento_id (
    id,
    profissional_id,
    cliente:cliente_id (nome),
    servico:servico_id (nome)
  )
`

export const caixaService = {
  async getAll() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('transacao_caixa')
      .select(TRANSACAO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .order('data_hora', { ascending: false })

    if (error) throw error
    return data as unknown as TransacaoCaixa[]
  },

  async getByDate(startDate: string, endDate: string, profissionalId?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('transacao_caixa')
      .select(TRANSACAO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      // Filtrar transações que são do usuário OU de agendamentos do profissional
      query = query.or(`usuario_id.eq.${profissionalId},agendamento(profissional_id).eq.${profissionalId}`)
    }

    const { data, error } = await query.order('data_hora', { ascending: false })

    if (error) throw error
    return data as unknown as TransacaoCaixa[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transacao_caixa')
      .select(TRANSACAO_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as TransacaoCaixa
  },

  async create(transacao: Omit<TransacaoCaixa, 'id' | 'salao_id' | 'usuario_id' | 'created_at' | 'usuario' | 'agendamento'>) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('transacao_caixa') as any)
      .insert({
        salao_id: usuario.salao_id,
        usuario_id: usuario.id,
        agendamento_id: transacao.agendamento_id,
        tipo: transacao.tipo,
        valor: transacao.valor,
        forma_pagamento: transacao.forma_pagamento,
        categoria: transacao.categoria,
        descricao: transacao.descricao,
        data_hora: transacao.data_hora,
      })
      .select(TRANSACAO_SELECT)
      .single()

    if (error) throw error

    // Se houver agendamento vinculado, marcar como concluído
    if (transacao.agendamento_id) {
      await agendamentoService.updateStatus(transacao.agendamento_id, 'concluido')
    }

    return data as unknown as TransacaoCaixa
  },

  async delete(id: string) {
    const { error } = await supabase.from('transacao_caixa').delete().eq('id', id)

    if (error) throw error
  },

  async getSummary(startDate: string, endDate: string, profissionalId?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('transacao_caixa')
      .select('tipo, valor, agendamento:agendamento_id(profissional_id)')
      .eq('salao_id', usuario.salao_id)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      // Filtrar transações que são do usuário OU de agendamentos do profissional
      query = query.or(`usuario_id.eq.${profissionalId},agendamento(profissional_id).eq.${profissionalId}`)
    }

    const { data, error } = await query

    if (error) throw error

    const entradas = (data as any[])
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0)

    const saidas = (data as any[])
      .filter((t) => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0)

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    }
  },
}
