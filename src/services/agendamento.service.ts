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
  let duracao = Number(ag.servico?.duracao_minutos) || 60
  if (ag.itens && ag.itens.length > 0) {
    const durItens = ag.itens.reduce((acc: number, item: any) => acc + (Number(item.duracao_minutos) || 0), 0)
    if (durItens > 0) {
      duracao = durItens
    }
  }
  
  const dataFim = new Date(dataInicio.getTime() + duracao * 60000)

  let status = ag.status

  // Se o agendamento está ativo/em andamento e seu horário terminou, promove diretamente a pendente_caixa
  if (['agendado', 'em_atendimento', 'em_atraso'].includes(status)) {
    if (dataFim <= now) {
      status = 'pendente_caixa'
    } else if (dataInicio <= now) {
      status = 'em_atendimento'
    }
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

    // 1. Buscar IDs de agendamentos que já possuem transação ATIVA vinculada por agendamento_id
    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('agendamento_id')
      .eq('salao_id', usuario.salao_id)
      .not('agendamento_id', 'is', null)
      .eq('status', 'ativo')

    const idsComTransacaoAtiva = (transacoes || [])
      .map((t: any) => t.agendamento_id)
      .filter(Boolean)

    const idsComTransacaoSet = new Set(idsComTransacaoAtiva)

    // 2. Buscar agendamentos do salão no período
    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['agendado', 'em_atendimento', 'pendente_caixa'])
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    query = query.order('data_hora', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
    const pendentes = mapped.filter((ag: any) => ag.status === 'pendente_caixa' && !idsComTransacaoSet.has(ag.id))

    // Deduplicação automática: identifica duplicatas no mesmo dia/horário e cancela no banco
    const uniqueMap = new Map<string, Agendamento>()
    const duplicatesToCancel: string[] = []

    for (const ag of pendentes) {
      const dataDia = ag.data_hora ? ag.data_hora.slice(0, 10) : ''
      const key = `${ag.cliente_id || ''}_${ag.servico_id || ''}_${ag.profissional_id || ''}_${dataDia}`
      if (uniqueMap.has(key)) {
        duplicatesToCancel.push(ag.id)
      } else {
        uniqueMap.set(key, ag)
      }
    }

    if (duplicatesToCancel.length > 0) {
      (supabase.from('agendamento') as any)
        .update({ status: 'cancelado' })
        .in('id', duplicatesToCancel)
        .then(({ error }: any) => {
          if (error) {
            console.error('Erro ao cancelar duplicatas de agendamentos no banco:', error)
          }
        })
    }

    return Array.from(uniqueMap.values())
  },

  async hasAnyPendencia(profissionalId?: string): Promise<boolean> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('agendamento_id')
      .eq('salao_id', usuario.salao_id)
      .not('agendamento_id', 'is', null)
      .eq('status', 'ativo')

    const idsComTransacaoAtiva = (transacoes || [])
      .map((t: any) => t.agendamento_id)
      .filter(Boolean)

    const idsComTransacaoSet = new Set(idsComTransacaoAtiva)

    let query = supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['agendado', 'em_atendimento', 'pendente_caixa'])

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map(mapAgendamentoRealTimeStatus) as unknown as Agendamento[]
    const pendentes = mapped.filter((ag: any) => ag.status === 'pendente_caixa' && !idsComTransacaoSet.has(ag.id))
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
        duracao_minutos: Number(item.duracao_minutos) || 30,
        comissao_percentual: item.comissao_percentual || null,
        comissao_valor: item.comissao_valor || 0,
      }))

      const { error: errorItens } = await (supabase
        .from('agendamento_servico') as any)
        .insert(itensToInsert)

      if (errorItens) {
        console.error('Erro ao salvar itens do agendamento:', errorItens)
        throw errorItens
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
          duracao_minutos: Number(item.duracao_minutos) || 30,
          comissao_percentual: item.comissao_percentual || null,
          comissao_valor: item.comissao_valor || 0,
        }))

        const { error: errorItens } = await (supabase.from('agendamento_servico') as any).insert(itensToInsert)
        if (errorItens) {
          console.error('Erro ao atualizar itens do agendamento:', errorItens)
          throw errorItens
        }
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

    const { data: transacoes } = await supabase
      .from('transacao_caixa')
      .select('agendamento_id')
      .eq('salao_id', usuario.salao_id)
      .not('agendamento_id', 'is', null)
      .eq('status', 'ativo')

    const idsComTransacaoAtiva = (transacoes || [])
      .map((t: any) => t.agendamento_id)
      .filter(Boolean)

    const idsComTransacaoSet = new Set(idsComTransacaoAtiva)

    const { data, error } = await supabase
      .from('agendamento')
      .select(AGENDAMENTO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .in('status', ['agendado', 'em_atendimento', 'pendente_caixa'])
      .order('data_hora', { ascending: false })

    if (error) throw error
    const mapped = (data || []).map(mapAgendamentoRealTimeStatus)
    const pendentes = mapped.filter((ag: any) => ag.status === 'pendente_caixa' && !idsComTransacaoSet.has(ag.id)) as unknown as Agendamento[]

    const uniqueMap = new Map<string, Agendamento>()
    for (const ag of pendentes) {
      const dataDia = ag.data_hora ? ag.data_hora.slice(0, 10) : ''
      const key = `${ag.cliente_id || ''}_${ag.servico_id || ''}_${ag.profissional_id || ''}_${dataDia}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ag)
      }
    }
    return Array.from(uniqueMap.values())
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
      const agDuracaoItens = ag.itens && ag.itens.length > 0
        ? ag.itens.reduce((acc: number, it: any) => acc + (Number(it.duracao_minutos) || 0), 0)
        : 0
      const agDuracao = agDuracaoItens > 0 ? agDuracaoItens : (Number(ag.servico?.duracao_minutos) || 60)
      const agFim = new Date(agInicio.getTime() + agDuracao * 60000)

      // Lógica de sobreposição: (A_inicio < B_fim) AND (A_fim > B_inicio)
      return novoInicio < agFim && novoFim > agInicio
    })
  },
}
