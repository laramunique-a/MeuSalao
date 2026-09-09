import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Agendamento, TransacaoCaixa } from '@/types/models'
import { mapAgendamentoRealTimeStatus } from '@/services/agendamento.service'

export const relatoriosService = {
  async getClienteReport(clienteId: string) {
    if (!clienteId) throw new Error('Cliente não selecionado')
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar todos os agendamentos do cliente
    const { data: agendamentos, error: errorAg } = await supabase
      .from('agendamento')
      .select(`
        *,
        profissional:profissional_id (id, nome),
        servico:servico_id (id, nome),
        itens:agendamento_servico (
          id,
          valor,
          duracao_minutos,
          servico:servico_id (id, nome),
          profissional:profissional_id (id, nome)
        )
      `)
      .eq('salao_id', usuario.salao_id)
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
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar todas as sessões de caixa
    const { data: caixas, error: errorCaixas } = await supabase
      .from('caixa_diario')
      .select('*, usuario_abertura:usuario_abertura_id(nome), usuario_fechamento:usuario_fechamento_id(nome)')
      .eq('salao_id', usuario.salao_id)
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
      .eq('salao_id', usuario.salao_id)
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

  async registrarPagamentoComissao(dados: {
    profissional_id: string
    valor: number
    forma_pagamento: string
    data_pagamento: string
    observacoes?: string
  }) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('pagamento_comissao') as any)
      .insert({
        salao_id: usuario.salao_id,
        profissional_id: dados.profissional_id,
        usuario_id: usuario.id,
        valor: dados.valor,
        forma_pagamento: dados.forma_pagamento,
        data_pagamento: dados.data_pagamento,
        observacoes: dados.observacoes,
        status: 'pago',
      })
      .select('*, profissional:profissional_id(nome), usuario:usuario_id(nome)')
      .single()

    if (error) throw error
    return data
  },

  async estornarPagamentoComissao(id: string) {
    const { data, error } = await (supabase
      .from('pagamento_comissao') as any)
      .update({ status: 'estornado' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getFolhaPagamentoReport(startDate?: string, endDate?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar registros na nova tabela pagamento_comissao
    let queryNovos = (supabase
      .from('pagamento_comissao') as any)
      .select('*, profissional:profissional_id(id, nome), usuario:usuario_id(nome)')
      .eq('salao_id', usuario.salao_id)

    if (usuario.perfil === 'profissional') {
      queryNovos = queryNovos.eq('profissional_id', usuario.id)
    }
    if (startDate) {
      queryNovos = queryNovos.gte('data_pagamento', startDate)
    }
    if (endDate) {
      queryNovos = queryNovos.lte('data_pagamento', endDate)
    }

    const { data: novosData } = await queryNovos.order('data_pagamento', { ascending: false })

    const novosIds = new Set((novosData || []).map((p: any) => p.id))

    // 2. Buscar registros legados em transacao_caixa para compatibilidade
    let queryLegadas = supabase
      .from('transacao_caixa')
      .select('*, usuario:usuario_id(nome)')
      .eq('salao_id', usuario.salao_id)
      .eq('categoria', 'Pagamento de Comissão')

    if (usuario.perfil === 'profissional') {
      queryLegadas = queryLegadas.eq('metadata->>profissional_id', usuario.id)
    }
    if (startDate) {
      queryLegadas = queryLegadas.gte('data_hora', startDate)
    }
    if (endDate) {
      queryLegadas = queryLegadas.lte('data_hora', endDate)
    }

    const { data: legadasData } = await queryLegadas.order('data_hora', { ascending: false })

    const resultado: any[] = []

    novosData?.forEach((p: any) => {
      resultado.push({
        id: p.id,
        data_hora: p.data_pagamento,
        forma_pagamento: p.forma_pagamento,
        descricao: p.observacoes || `Repasse: ${p.profissional?.nome || 'Profissional'}`,
        valor: Number(p.valor),
        status: p.status === 'pago' ? 'ativo' : p.status,
        usuario: p.usuario,
        profissional: p.profissional,
        metadata: {
          profissional_id: p.profissional_id,
          profissional_nome: p.profissional?.nome,
        },
      })
    })

    legadasData?.forEach((t: any) => {
      if (!novosIds.has(t.id)) {
        resultado.push(t)
      }
    })

    // Ordenar por data decrescente
    return resultado.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
  },

  async getSaldosComissoesReport(startDate?: string, endDate?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

    // 1. Buscar todas as transações de entrada com comissão (comissões geradas)
    const { data: geradasData, error: errGeradas } = await supabase
      .from('transacao_caixa')
      .select(`
        id,
        agendamento_id,
        comissao_valor,
        data_hora,
        metadata,
        descricao,
        valor,
        agendamento:agendamento_id (
          id,
          profissional_id,
          profissional:profissional_id (id, nome),
          cliente:cliente_id (nome)
        )
      `)
      .eq('salao_id', usuario.salao_id)
      .eq('tipo', 'entrada')
      .eq('status', 'ativo')

    if (errGeradas) throw errGeradas

    // 2. Buscar todas as comissões pagas (nova tabela + legado transacao_caixa)
    const { data: pagasNovas } = await (supabase
      .from('pagamento_comissao') as any)
      .select('id, valor, data_pagamento, profissional_id, status')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'pago')

    const novosIds = new Set((pagasNovas || []).map((p: any) => p.id))

    const { data: pagasLegadas } = await supabase
      .from('transacao_caixa')
      .select('id, valor, data_hora, metadata, status')
      .eq('salao_id', usuario.salao_id)
      .eq('categoria', 'Pagamento de Comissão')
      .eq('status', 'ativo')

    const pagasData: any[] = []

    pagasNovas?.forEach((p: any) => {
      pagasData.push({
        id: p.id,
        valor: Number(p.valor),
        data_hora: p.data_pagamento,
        profissional_id: p.profissional_id,
        status: p.status,
      })
    })

    pagasLegadas?.forEach((t: any) => {
      if (!novosIds.has(t.id)) {
        pagasData.push({
          id: t.id,
          valor: Number(t.valor),
          data_hora: t.data_hora,
          profissional_id: t.metadata?.profissional_id,
          status: t.status,
        })
      }
    })

    // 3. Buscar profissionais ativos que podem atender (excluir super_admin)
    const { data: profissionais, error: errProfs } = await supabase
      .from('usuario')
      .select('id, nome, perfil')
      .eq('salao_id', usuario.salao_id)
      .neq('perfil', 'super_admin')
      .eq('pode_atender', true)

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
      detalhes: {
        data_hora: string
        cliente: string
        descricao: string
        valor_bruto: number
        comissao_valor: number
      }[]
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
        saldo_pendente: 0,
        detalhes: []
      }
    })

    // Agrupar comissões geradas
    // Os TOTAIS (gerado_historico, gerado_periodo) acumulam corretamente todas as transações.
    // Os DETALHES são agrupados por chave (agendamento_id + profissional_id + servico_nome)
    // para que pagamentos split ([1/2] + [2/2]) apareçam como UMA única linha no relatório.
    const detalhesMapPorProf: Record<string, Map<string, {
      data_hora: string
      cliente: string
      descricao: string
      valor_bruto: number
      comissao_valor: number
    }>> = {}
    profissionais?.forEach((p: any) => { detalhesMapPorProf[p.id] = new Map() })

    geradasData?.forEach((t: any) => {
      const breakdown = t.metadata?.comissoes_breakdown
      if (Array.isArray(breakdown) && breakdown.length > 0) {
        breakdown.forEach((item: any) => {
          const profId = item.profissional_id
          if (!profId || !saldosMap[profId]) return

          const rawComissao = Number(item.comissao_valor) || 0
          const tComissao = Number(t.comissao_valor)
          // Se o comissao_valor do item exceder a comissão da transação individual (como ocorria em transações antigas), limita a t.comissao_valor
          const valorComissao = (tComissao > 0 && rawComissao > tComissao) ? tComissao : rawComissao

          const rawBruto = Number(item.valor_servico) || 0
          const tValor = Number(t.valor)
          const valorBruto = (tValor > 0 && rawBruto > tValor) ? tValor : rawBruto

          saldosMap[profId].gerado_historico += valorComissao

          const tDate = new Date(t.data_hora)
          const insidePeriod = (!startDate || tDate >= new Date(startDate)) && (!endDate || tDate <= new Date(endDate))
          if (insidePeriod) {
            saldosMap[profId].gerado_periodo += valorComissao

            // Chave de agrupamento: une partes de split do mesmo serviço/agendamento
            const detalheKey = `${t.agendamento_id || t.id}-${profId}-${item.servico_nome || ''}`
            const clienteNome = (t.agendamento as any)?.cliente?.nome || 'Cliente'

            const existing = detalhesMapPorProf[profId]?.get(detalheKey)
            if (existing) {
              // Acumular split — somar valores na mesma linha
              existing.valor_bruto += valorBruto
              existing.comissao_valor += valorComissao
            } else {
              detalhesMapPorProf[profId]?.set(detalheKey, {
                data_hora: t.data_hora,
                cliente: clienteNome,
                descricao: item.servico_nome || 'Serviço',
                valor_bruto: valorBruto,
                comissao_valor: valorComissao
              })
            }
          }
        })
      } else {
        // Agendamento tradicional com 1 único profissional (sem breakdown)
        const profId = t.metadata?.profissional_id || t.agendamento?.profissional_id
        if (!profId || !saldosMap[profId]) return

        const valor = Number(t.comissao_valor) || 0
        saldosMap[profId].gerado_historico += valor

        const tDate = new Date(t.data_hora)
        const insidePeriod = (!startDate || tDate >= new Date(startDate)) && (!endDate || tDate <= new Date(endDate))
        if (insidePeriod) {
          saldosMap[profId].gerado_periodo += valor

          const detalheKey = `${t.agendamento_id || t.id}-${profId}-${t.descricao || ''}`
          const clienteNome = (t.agendamento as any)?.cliente?.nome || 'Cliente'
          const valorBruto = Number((t.metadata as any)?.pagamento?.valor_bruto) || Number(t.valor) || 0

          const existing = detalhesMapPorProf[profId]?.get(detalheKey)
          if (existing) {
            existing.valor_bruto += valorBruto
            existing.comissao_valor += valor
          } else {
            detalhesMapPorProf[profId]?.set(detalheKey, {
              data_hora: t.data_hora,
              cliente: clienteNome,
              descricao: t.descricao,
              valor_bruto: valorBruto,
              comissao_valor: valor
            })
          }
        }
      }
    })

    // Transferir os detalhes agrupados para o saldosMap
    Object.keys(saldosMap).forEach((profId) => {
      saldosMap[profId].detalhes = Array.from(detalhesMapPorProf[profId]?.values() || [])
    })

    // Agrupar comissões pagas
    pagasData?.forEach((t: any) => {
      const profId = t.profissional_id || t.metadata?.profissional_id
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
