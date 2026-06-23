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
}
