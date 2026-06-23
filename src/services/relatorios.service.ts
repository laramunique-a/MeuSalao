import { supabase } from '@/lib/supabase'
import type { Agendamento, TransacaoCaixa } from '@/types/models'

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

    // 2. Buscar todos os agendamentos pendentes ou concluídos
    const { data: agendamentos, error: errorAg } = await supabase
      .from('agendamento')
      .select(`
        *,
        cliente:cliente_id (id, nome),
        profissional:profissional_id (id, nome),
        servico:servico_id (id, nome)
      `)
      .in('status', ['pendente_caixa', 'concluido'])
      .order('data_hora', { ascending: false })

    if (errorAg) throw errorAg

    // 3. Buscar todas as transações ativas vinculadas a agendamentos
    const { data: transacoes, error: errorTrans } = await supabase
      .from('transacao_caixa')
      .select('*, agendamento_id, caixa:caixa_id(*)')
      .eq('status', 'ativo')
      .not('agendamento_id', 'is', null)

    if (errorTrans) throw errorTrans
    const transacoesList = (transacoes || []) as any[]

    // Mapear cada atendimento para a sessão de caixa em que foi gerado e onde foi pago
    const reportItems = (agendamentos || []).map((ag: any) => {
      const agDate = new Date(ag.data_hora)

      // Achar a sessão de caixa aberta no horário do atendimento
      const caixaOrigem = caixasList.find((c: any) => {
        const ab = new Date(c.data_abertura)
        const fc = c.data_fechamento ? new Date(c.data_fechamento) : null
        return agDate >= ab && (!fc || agDate <= fc)
      })

      // Achar transação de quitação (se houver)
      const transacao = transacoesList.find((t: any) => t.agendamento_id === ag.id)
      const caixaQuitacao = transacao?.caixa

      return {
        id: ag.id,
        data_hora: ag.data_hora,
        cliente: ag.cliente?.nome || 'Cliente Removido',
        valor: ag.valor,
        profissional: ag.profissional?.nome || 'Funcionário Removido',
        servico: ag.servico?.nome || 'Serviço Removido',
        status: ag.status === 'pendente_caixa' ? 'pendente' : 'quitado',
        caixa_origem: caixaOrigem ? {
          id: caixaOrigem.id,
          data_abertura: caixaOrigem.data_abertura,
          usuario_abertura: caixaOrigem.usuario_abertura?.nome
        } : null,
        caixa_quitacao: caixaQuitacao ? {
          id: caixaQuitacao.id,
          data_abertura: caixaQuitacao.data_abertura,
        } : null
      }
    })

    return reportItems
  },
}
