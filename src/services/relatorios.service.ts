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

  async getSaldosComissoesReport(startDate?: string, endDate?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar todas as transações de entrada com comissão (comissões geradas)
    const { data: geradasData, error: errGeradas } = await supabase
      .from('transacao_caixa')
      .select(`
        comissao_valor,
        data_hora,
        metadata,
        agendamento:agendamento_id (
          profissional_id,
          profissional:profissional_id (id, nome)
        )
      `)
      .eq('salao_id', usuario.salao_id)
      .eq('tipo', 'entrada')
      .eq('status', 'ativo')
      .gt('comissao_valor', 0)

    if (errGeradas) throw errGeradas

    // 2. Buscar todas as transações de pagamento de comissão (comissões pagas)
    const { data: pagasData, error: errPagas } = await supabase
      .from('transacao_caixa')
      .select('valor, data_hora, metadata')
      .eq('salao_id', usuario.salao_id)
      .eq('categoria', 'Pagamento de Comissão')
      .eq('status', 'ativo')

    if (errPagas) throw errPagas

    // 3. Buscar profissionais ativos
    const { data: profissionais, error: errProfs } = await supabase
      .from('usuario')
      .select('id, nome, perfil')
      .eq('salao_id', usuario.salao_id)
      .eq('perfil', 'profissional')

    if (errProfs) throw errProfs

    // Mapear saldos consolidados por profissional
    const saldosMap: Record<string, {
      profissional_id: string
      nome: string
      gerado_periodo: number
      pago_periodo: number
      gerado_historico: number
      pago_historico: number
      saldo_pendente: number
    }> = {}

    // Inicializar profissionais
    profissionais?.forEach((p: any) => {
      saldosMap[p.id] = {
        profissional_id: p.id,
        nome: p.nome,
        gerado_periodo: 0,
        pago_periodo: 0,
        gerado_historico: 0,
        pago_historico: 0,
        saldo_pendente: 0
      }
    })

    // Agrupar comissões geradas
    geradasData?.forEach((t: any) => {
      const profId = t.metadata?.profissional_id || t.agendamento?.profissional_id
      if (!profId || !saldosMap[profId]) return

      const valor = Number(t.comissao_valor) || 0
      saldosMap[profId].gerado_historico += valor

      // Se houver filtro de período, verificar se está no intervalo
      const tDate = new Date(t.data_hora)
      const insidePeriod = (!startDate || tDate >= new Date(startDate)) && (!endDate || tDate <= new Date(endDate))
      if (insidePeriod) {
        saldosMap[profId].gerado_periodo += valor
      }
    })

    // Agrupar comissões pagas
    pagasData?.forEach((t: any) => {
      const profId = t.metadata?.profissional_id
      if (!profId || !saldosMap[profId]) return

      const valor = Number(t.valor) || 0
      saldosMap[profId].pago_historico += valor

      // Se houver filtro de período, verificar se está no intervalo
      const tDate = new Date(t.data_hora)
      const insidePeriod = (!startDate || tDate >= new Date(startDate)) && (!endDate || tDate <= new Date(endDate))
      if (insidePeriod) {
        saldosMap[profId].pago_periodo += valor
      }
    })

    // Calcular saldos pendentes históricos (gerado_historico - pago_historico)
    Object.keys(saldosMap).forEach((id) => {
      const p = saldosMap[id]
      p.saldo_pendente = p.gerado_historico - p.pago_historico
    })

    // Se o usuário logado for profissional comum, retornar apenas o saldo dele
    if (usuario.perfil === 'profissional') {
      return saldosMap[usuario.id] ? [saldosMap[usuario.id]] : []
    }

    return Object.values(saldosMap)
  },
}
