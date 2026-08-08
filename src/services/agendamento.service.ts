import { supabase } from '@/lib/supabase'
import type { Agendamento, AgendamentoStatus } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

const AGENDAMENTO_SELECT = `
  *,
  cliente:cliente_id (id, nome, telefone),
  profissional:profissional_id (id, nome, perfil, comissao_percentual),
  servico:servico_id (id, nome, valor, duracao_minutos),
  itens:agendamento_servico (
    id,
    agendamento_id,
    servico_id,
    profissional_id,
    valor,
    duracao_minutos,
    comissao_percentual,
    comissao_valor,
    servico:servico_id (id, nome, valor, duracao_minutos, comissao_percentual),
    profissional:profissional_id (id, nome, perfil, comissao_percentual)
  )
`

const statusUpdateInProgress = new Set<string>()

export function mapAgendamentoRealTimeStatus(ag: any): any {
  if (!ag) return ag
  const now = new Date()
  const dataInicio = new Date(ag.data_hora)
  
  // Se houver itens, a duração total é a soma das durações dos itens
  let duracao = ag.servico?.duracao_minutos || 60
  if (ag.itens && ag.itens.length > 0) {
    duracao = ag.itens.reduce((acc: number, item: any) => acc + (Number(item.duracao_minutos) || 0), 0)
  }
  
  const dataFim = new Date(dataInicio.getTime() + duracao * 60000)

  let status = ag.status

  if (status === 'agendado' && dataInicio <= now) {
    status = 'em_atendimento'
  } else if (status === 'em_atendimento' && dataFim <= now) {
    status = 'pendente_caixa'
  }

  if (status !== ag.status) {
    const updated = { ...ag, status }
    
    // Atualizar no banco em background se não estiver em progresso
    if (!statusUpdateInProgress.has(ag.id)) {
      statusUpdateInProgress.add(ag.id)
      
      const runUpdate = async () => {
        try {
          const { error } = await (supabase.from('agendamento') as any)
            .update({ status })
            .eq('id', ag.id)
          if (error) {
            console.error(`Erro ao atualizar status em background para ${ag.id}:`, error)
          }
        } catch (err) {
          console.error(`Erro ao atualizar status em background para ${ag.id}:`, err)
        } finally {
          setTimeout(() => {
            statusUpdateInProgress.delete(ag.id)
          }, 10000)
        }
      }
      runUpdate()
    }
    
    return updated
  }

  return ag
}

export const agendamentoService = {
  async getAll() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)

    if (usuario.perfil !== 'administrador' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
  },

  async getByDate(startDate: string, endDate: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (usuario.perfil !== 'administrador' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
  },

  async getByDateAndStatus(startDate: string, endDate: string, status: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .eq('status', status)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (usuario.perfil !== 'administrador' && usuario.perfil !== 'super_admin') {
      query = query.eq('profissional_id', usuario.id)
    }

    const { data, error } = await query
      .order('data_hora', { ascending: true })

    if (error) throw error
    return (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
  },

  async getAgendamentosSemBaixa(startDate: string, endDate: string, profissionalId?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar transações ATIVAS deste salão
    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('id, agendamento_id, descricao')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'ativo')

    const transList = transacoes || []
    const idsComTransacaoSet = new Set(
      transList.map((t: any) => t.agendamento_id).filter(Boolean)
    )

    // 2. Buscar agendamentos em_atendimento ou pendente_caixa do salão
    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['em_atendimento', 'pendente_caixa'])
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    query = query.order('data_hora', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]

    const agendamentosSemBaixa: Agendamento[] = []
    const agendamentosParaConcluir: string[] = []

    for (const ag of mapped) {
      if (ag.status !== 'pendente_caixa') continue

      // Caso 1: Vínculo direto por agendamento_id
      if (idsComTransacaoSet.has(ag.id)) {
        agendamentosParaConcluir.push(ag.id)
        continue
      }

      // Caso 2: Vínculo por nome do cliente na descrição da transação
      const clienteNome = ag.cliente?.nome?.trim().toLowerCase()
      if (clienteNome && clienteNome.length > 2) {
        const transCorrespondente = transList.find((t: any) => {
          const desc = (t.descricao || '').toLowerCase()
          return desc.includes(clienteNome)
        })

        if (transCorrespondente) {
          agendamentosParaConcluir.push(ag.id)
          // Vincular transação ao agendamento se estiver nulo
          if (!transCorrespondente.agendamento_id) {
            ;(supabase.from('transacao_caixa') as any)
              .update({ agendamento_id: ag.id })
              .eq('id', transCorrespondente.id)
              .then(() => {})
          }
          continue
        }
      }

      agendamentosSemBaixa.push(ag)
    }

    // Sincronização em lote: Marcar como 'concluido' no banco os agendamentos que já possuem movimentação ativa
    if (agendamentosParaConcluir.length > 0) {
      try {
        await (supabase.from('agendamento') as any)
          .update({ status: 'concluido' })
          .eq('salao_id', usuario.salao_id)
          .in('id', agendamentosParaConcluir)
      } catch (errSync) {
        console.error('Erro ao sincronizar status concluido de agendamentos baixados:', errSync)
      }
    }

    return agendamentosSemBaixa
  },

  async hasAnyPendencia(profissionalId?: string): Promise<boolean> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('id, agendamento_id, descricao')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'ativo')

    const transList = transacoes || []
    const idsComTransacaoSet = new Set(
      transList.map((t: any) => t.agendamento_id).filter(Boolean)
    )

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['em_atendimento', 'pendente_caixa'])

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
    
    const pendentes = mapped.filter((ag: any) => {
      if (ag.status !== 'pendente_caixa') return false
      if (idsComTransacaoSet.has(ag.id)) return false
      const clienteNome = ag.cliente?.nome?.trim().toLowerCase()
      if (clienteNome && clienteNome.length > 2) {
        const transCorrespondente = transList.find((t: any) => (t.descricao || '').toLowerCase().includes(clienteNome))
        if (transCorrespondente) return false
      }
      return true
    })

    return pendentes.length > 0
  },

  async getByProfissionalAndDate(
    profissionalId: string,
    startDate: string,
    endDate: string
  ) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

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
    return (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return mapAgendamentoRealTimeStatus(data) as unknown as Agendamento
  },

  async create(agendamentoData: Omit<Agendamento, 'id' | 'salao_id' | 'created_at' | 'updated_at' | 'cliente' | 'profissional' | 'servico'>) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { itens, ...agendamentoFields } = agendamentoData as any

    let mainProfissionalId = agendamentoFields.profissional_id
    let mainServicoId = agendamentoFields.servico_id
    let totalValor = agendamentoFields.valor || 0

    if (itens && itens.length > 0) {
      mainProfissionalId = itens[0].profissional_id
      mainServicoId = itens[0].servico_id
      totalValor = itens.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0)
    }

    const { data: createdAgendamento, error } = await (supabase
      .from('agendamento') as any)
      .insert({
        salao_id: usuario.salao_id,
        cliente_id: agendamentoFields.cliente_id,
        profissional_id: mainProfissionalId,
        servico_id: mainServicoId,
        data_hora: agendamentoFields.data_hora,
        status: agendamentoFields.status || 'agendado',
        valor: totalValor,
        observacoes: agendamentoFields.observacoes || null,
      })
      .select('id')
      .single()

    if (error) throw error

    if (itens && itens.length > 0) {
      const itensToInsert = itens.map((item: any) => ({
        agendamento_id: createdAgendamento.id,
        servico_id: item.servico_id,
        profissional_id: item.profissional_id,
        valor: item.valor,
        duracao_minutos: item.duracao_minutos || 30,
        comissao_percentual: item.comissao_percentual || null,
        comissao_valor: item.comissao_valor || 0,
      }))

      const { error: errorItens } = await (supabase
        .from('agendamento_servico') as any)
        .insert(itensToInsert)

      if (errorItens) {
        console.error('Erro ao salvar itens do agendamento:', errorItens)
      }
    }

    return this.getById(createdAgendamento.id)
  },

  async update(id: string, agendamentoData: Partial<Agendamento>) {
    const { cliente, profissional, servico, itens, ...updateData } = agendamentoData as any

    if (itens && itens.length > 0) {
      updateData.profissional_id = itens[0].profissional_id
      updateData.servico_id = itens[0].servico_id
      updateData.valor = itens.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0)
    }

    const { error } = await (supabase
      .from('agendamento') as any)
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    if (itens) {
      await (supabase.from('agendamento_servico') as any).delete().eq('agendamento_id', id)

      if (itens.length > 0) {
        const itensToInsert = itens.map((item: any) => ({
          agendamento_id: id,
          servico_id: item.servico_id,
          profissional_id: item.profissional_id,
          valor: item.valor,
          duracao_minutos: item.duracao_minutos || 30,
          comissao_percentual: item.comissao_percentual || null,
          comissao_valor: item.comissao_valor || 0,
        }))

        await (supabase.from('agendamento_servico') as any).insert(itensToInsert)
      }
    }

    return this.getById(id)
  },

  async updateStatus(id: string, status: AgendamentoStatus) {
    const { data, error } = await (supabase
      .from('agendamento') as any)
      .update({ status })
      .eq('id', id)
      .select(AGENDAMENTO_SELECT)
      .single()

    if (error) throw error
    return mapAgendamentoRealTimeStatus(data) as unknown as Agendamento
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('agendamento')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getPendenciasGlobais() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['em_atendimento', 'pendente_caixa'])
      .order('data_hora', { ascending: false })

    if (error) throw error
    const mapped = (data || []).map(mapAgendamentoRealTimeStatus)
    return mapped.filter((ag: any) => ag.status === 'pendente_caixa') as unknown as Agendamento[]
  },

  async checkConflict(
    profissionalId: string,
    dataHora: string,
    duracaoMinutos: number,
    excludeId?: string
  ): Promise<boolean> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

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
