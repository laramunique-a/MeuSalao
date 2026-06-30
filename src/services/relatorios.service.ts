import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Agendamento, TransacaoCaixa } from '@/types/models'
import { mapAgendamentoRealTimeStatus } from '@/services/agendamento.service'

export const relatoriosService = {
  async getClienteReport(clienteId: string) {
    if (!clienteId) throw new Error('Cliente não selecionado')

    // 1. Buscar todos os agendamentos do cliente
    const { data: agendamentos, error: errorAg } = await supabase
      .from('agendamento')
      .select(`
        *,
        profissional:profissional_id (id, nome),
        servico:servico_id (id, nome)
      `)
      .eq('cliente_id', clienteId)
      .order('data_hora', { ascending: false })

    if (errorAg) throw errorAg

    // 2. Buscar todas as transações vinculadas a estes agendamentos
    let transacoes: TransacaoCaixa[] = []
    const appointmentIds = (agendamentos || []).map((a: any) => a.id)

    if (appointmentIds.length > 0) {
      const { data: dataTrans, error: errorTrans } = await supabase
        .from('transacao_caixa')
        .select(`
          *,
          usuario:usuario_id (id, nome),
          agendamento:agendamento_id (
            id,
            servico:servico_id (nome)
          )
        `)
        .in('agendamento_id', appointmentIds)
        .order('data_hora', { ascending: false })

      if (errorTrans) throw errorTrans
      transacoes = dataTrans as unknown as TransacaoCaixa[]
    }

    return {
      agendamentos: agendamentos as unknown as Agendamento[],
      transacoes,
    }
  },

  async getCaixaPendenciasReport() {
    // 1. Buscar todas as sessões de caixa
    const { data: caixas, error: errorCaixas } = await supabase
      .from('caixa_diario')
      .select('*, usuario_abertura:usuario_abertura_id(nome), usuario_fechamento:usuario_fechamento_id(nome)')
      .order('data_abertura', { ascending: false })

    if (errorCaixas) throw errorCaixas
    const caixasList = (caixas || []) as any[]

    // 2. Buscar todos os agendamentos pendentes (débitos ativos)
    const { data: agendamentos, error: errorAg } = await supabase
      .from('agendamento')
      .select(`
        *,
        cliente:cliente_id (id, nome),
        profissional:profissional_id (id, nome),
        servico:servico_id (id, nome)
      `)
      .in('status', ['em_atendimento', 'pendente_caixa'])
      .order('data_hora', { ascending: false })

    if (errorAg) throw errorAg

    // Mapear status em tempo real e filtrar apenas os que são 'pendente_caixa'
    const mappedAgendamentos = (agendamentos || [])
      .map(mapAgendamentoRealTimeStatus)
      .filter((ag: any) => ag.status === 'pendente_caixa')

    // Mapear cada atendimento para a sessão de caixa em que foi gerado
    const reportItems = mappedAgendamentos.map((ag: any) => {
      const agDate = new Date(ag.data_hora)

      // Achar a sessão de caixa aberta no horário do atendimento
      const caixaOrigem = caixasList.find((c: any) => {
        const ab = new Date(c.data_abertura)
        const fc = c.data_fechamento ? new Date(c.data_fechamento) : null
        return agDate >= ab && (!fc || agDate <= fc)
      })

      return {
        id: ag.id,
        data_hora: ag.data_hora,
        cliente: ag.cliente?.nome || 'Cliente Removido',
        valor: ag.valor,
        profissional: ag.profissional?.nome || 'Funcionário Removido',
        servico: ag.servico?.nome || 'Serviço Removido',
        status: 'pendente',
        caixa_origem: caixaOrigem ? {
          id: caixaOrigem.id,
          data_abertura: caixaOrigem.data_abertura,
          usuario_abertura: caixaOrigem.usuario_abertura?.nome
        } : null
      }
    })

    return reportItems
  },

  async getFolhaPagamentoReport(startDate?: string, endDate?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('transacao_caixa')
      .select('*, usuario:usuario_id(nome)')
      .eq('categoria', 'Pagamento de Comissão')

    // Se for profissional comum, ver apenas as próprias comissões pagas
    if (usuario.perfil === 'profissional') {
      query = query.eq('metadata->>profissional_id', usuario.id)
    }

    if (startDate) {
      query = query.gte('data_hora', startDate)
    }
    if (endDate) {
      query = query.lte('data_hora', endDate)
    }

    const { data: transacoes, error } = await query.order('data_hora', { ascending: false })

    if (error) throw error
    return (transacoes || []) as any[]
  },
}
