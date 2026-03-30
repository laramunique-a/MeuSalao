import { supabase } from '@/lib/supabase'
import type { Agendamento, AgendamentoStatus } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

const AGENDAMENTO_SELECT = `
  *,
  cliente:cliente_id (id, nome, telefone),
  profissional:profissional_id (id, nome, perfil, comissao_percentual),
  servico:servico_id (id, nome, valor, duracao_minutos)
`

export const agendamentoService = {
  async getAll() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)

    if (usuario.perfil !== 'admin' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data as unknown as Agendamento[]
  },

  async getByDate(startDate: string, endDate: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (usuario.perfil !== 'admin' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data as unknown as Agendamento[]
  },

  async getByDateAndStatus(startDate: string, endDate: string, status: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .eq('status', status)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (usuario.perfil !== 'admin' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data as unknown as Agendamento[]
  },

  async getAgendamentosSemBaixa(startDate: string, endDate: string, profissionalId?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    // Buscar IDs de agendamentos que já têm transação vinculada
    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('agendamento_id')
      .not('agendamento_id', 'is', null)

    const idsComTransacao = (transacoes || [])
      .map((t: any) => t.agendamento_id)
      .filter(Boolean)

    // Buscar agendamentos em_atendimento ou concluido sem transação
    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['em_atendimento', 'pendente_caixa', 'concluido'])
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    query = query.order('data_hora', { ascending: true })

    if (idsComTransacao.length > 0) {
      query = query.not('id', 'in', `(${idsComTransacao.join(',')})`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as Agendamento[]
  },

  async hasAnyPendencia(profissionalId?: string): Promise<boolean> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    // Buscar IDs de agendamentos que já têm transação vinculada
    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('agendamento_id')
      .not('agendamento_id', 'is', null)

    const idsComTransacao = (transacoes || [])
      .map((t: any) => t.agendamento_id)
      .filter(Boolean)

    // Buscar se existe algum agendamento em_atendimento ou concluido sem transação
    let query = supabase
      .from('agendamento')
      .select('id', { count: 'exact', head: true })
      .eq('salao_id', usuario.salao_id)
      .in('status', ['em_atendimento', 'pendente_caixa', 'concluido'])

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    if (idsComTransacao.length > 0) {
      query = query.not('id', 'in', `(${idsComTransacao.join(',')})`)
    }

    const { count, error } = await query
    if (error) throw error
    return (count || 0) > 0
  },

  async getByProfissionalAndDate(
    profissionalId: string,
    startDate: string,
    endDate: string
  ) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .eq('profissional_id', profissionalId)
      .in('status', ['agendado', 'confirmado', 'em_atendimento'])
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data as unknown as Agendamento[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as Agendamento
  },

  async create(agendamento: Omit<Agendamento, 'id' | 'salao_id' | 'created_at' | 'updated_at' | 'cliente' | 'profissional' | 'servico'>) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('agendamento') as any)
      .insert({
        ...agendamento,
        salao_id: usuario.salao_id,
        cliente_id: agendamento.cliente_id,
        profissional_id: agendamento.profissional_id,
        servico_id: agendamento.servico_id,
        data_hora: agendamento.data_hora,
        status: agendamento.status,
        valor: agendamento.valor,
        observacoes: agendamento.observacoes,
      })
      .select(AGENDAMENTO_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Agendamento
  },

  async update(id: string, agendamento: Partial<Agendamento>) {
    const { cliente, profissional, servico, ...updateData } = agendamento

    const { data, error } = await (supabase
      .from('agendamento') as any)
      .update(updateData)
      .eq('id', id)
      .select(AGENDAMENTO_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Agendamento
  },

  async updateStatus(id: string, status: AgendamentoStatus) {
    const { data, error } = await (supabase
      .from('agendamento') as any)
      .update({ status })
      .eq('id', id)
      .select(AGENDAMENTO_SELECT)
      .single()

    if (error) throw error
    return data as unknown as Agendamento
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('agendamento')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async checkConflict(
    profissionalId: string,
    dataHora: string,
    duracaoMinutos: number,
    excludeId?: string
  ): Promise<boolean> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    // Buscar todos os agendamentos do profissional no dia para verificar sobreposição
    const dataInicio = new Date(dataHora)
    dataInicio.setHours(0, 0, 0, 0)
    const dataFim = new Date(dataHora)
    dataFim.setHours(23, 59, 59, 999)

    const agendamentosDoDia = await this.getByProfissionalAndDate(
      profissionalId,
      dataInicio.toISOString(),
      dataFim.toISOString()
    )

    const novoInicio = new Date(dataHora)
    const novoFim = new Date(novoInicio.getTime() + duracaoMinutos * 60000)

    return agendamentosDoDia.some((ag) => {
      if (excludeId && ag.id === excludeId) return false

      const agInicio = new Date(ag.data_hora)
      const agDuracao = ag.servico?.duracao_minutos || 60
      const agFim = new Date(agInicio.getTime() + agDuracao * 60000)

      // Lógica de sobreposição: (A_inicio < B_fim) AND (A_fim > B_inicio)
      return novoInicio < agFim && novoFim > agInicio
    })
  },
}
