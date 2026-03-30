import { supabase } from '@/lib/supabase'
import type { TransacaoCaixa, CaixaDiario } from '@/types/models'
import { useAuthStore } from '@/store/authStore'
import { agendamentoService } from './agendamento.service'

const TRANSACAO_SELECT = `
  *,
  usuario:usuario_id (id, nome),
  agendamento:agendamento_id (
    id,
    profissional:profissional_id (id, nome),
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

    let query = (supabase
      .from('transacao_caixa') as any)
      .select(TRANSACAO_SELECT)
      .eq('salao_id', usuario.salao_id)
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      // Opcional: filtro adicional no código, mas o RLS já garante a segurança
      // Usar eq simples para o caminho do agendamento
      query = query.filter('agendamento.profissional_id', 'eq', profissionalId)
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

    // Verificar se existe caixa aberto
    const caixaAberto = await this.getCaixaAberto()
    if (!caixaAberto && transacao.categoria !== 'Abertura de Caixa') {
      throw new Error('Não é possível realizar movimentações com o caixa fechado.')
    }

    const { data, error } = await (supabase
      .from('transacao_caixa') as any)
      .insert({
        salao_id: usuario.salao_id,
        usuario_id: usuario.id,
        agendamento_id: transacao.agendamento_id,
        caixa_id: caixaAberto?.id || transacao.caixa_id,
        tipo: transacao.tipo,
        valor: transacao.valor,
        forma_pagamento: transacao.forma_pagamento,
        categoria: transacao.categoria,
        descricao: transacao.descricao,
        status: transacao.status || 'ativo',
        taxa_cartao: transacao.taxa_cartao || 0,
        comissao_valor: Number(transacao.comissao_valor) || 0,
        data_hora: transacao.data_hora,
        metadata: transacao.metadata || {},
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
    // Regra obrigatória: não excluir fisicamente. Usar status 'cancelado'.
    const { error } = await supabase
      .from('transacao_caixa')
      .update({ status: 'cancelado' } as any)
      .eq('id', id)

    if (error) throw error
  },

  async estornar(id: string) {
    const { error } = await (supabase
      .from('transacao_caixa') as any)
      .update({ status: 'estornado' })
      .eq('id', id)

    if (error) throw error
  },

  // --- Novos Métodos de Controle de Caixa ---

  async getCaixaAberto() {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('caixa_diario') as any)
      .select('*, usuario_abertura:usuario_abertura_id(nome)')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'aberto')
      .single()

    if (error && (error as any).code !== 'PGRST116') throw error
    return data as unknown as CaixaDiario | null
  },

  async getLastClosedCaixa(): Promise<CaixaDiario | null> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('caixa_diario') as any)
      .select('*')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'fechado')
      .order('data_fechamento', { ascending: false })
      .limit(1)
      .single()

    if (error && (error as any).code !== 'PGRST116') throw error
    return data as unknown as CaixaDiario | null
  },

  async abrirCaixa(valorInicial: number, observacoes?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    // Verificar se já existe um aberto
    const atual = await this.getCaixaAberto()
    if (atual) throw new Error('Já existe um caixa aberto para este salão.')

    const { data: novoCaixa, error: errorCaixa } = await (supabase
      .from('caixa_diario') as any)
      .insert({
        salao_id: usuario.salao_id,
        usuario_abertura_id: usuario.id,
        valor_inicial: valorInicial,
        status: 'aberto',
        observacoes,
      })
      .select()
      .single()

    if (errorCaixa) throw errorCaixa

    // Criar transação de entrada para o valor inicial
    await this.create({
      caixa_id: (novoCaixa as any).id,
      tipo: 'entrada',
      valor: valorInicial,
      forma_pagamento: 'dinheiro',
      categoria: 'Abertura de Caixa',
      descricao: `Abertura de caixa - Saldo inicial`,
      data_hora: new Date().toISOString(),
      status: 'ativo',
      agendamento_id: null
    })

    return novoCaixa as unknown as CaixaDiario
  },

  async fecharCaixa(caixaId: string, valorInformado: number, observacoes?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    // Calcular saldo do sistema para este caixa
    const { data: transacoes, error: errorTrans } = await (supabase
      .from('transacao_caixa') as any)
      .select('tipo, valor')
      .eq('caixa_id', caixaId)
      .eq('status', 'ativo')

    if (errorTrans) throw errorTrans

    const saldoSistema = (transacoes as any[]).reduce((acc, t) => {
      return t.tipo === 'entrada' ? acc + Number(t.valor) : acc - Number(t.valor)
    }, 0)

    const { data, error } = await (supabase
      .from('caixa_diario') as any)
      .update({
        usuario_fechamento_id: usuario.id,
        data_fechamento: new Date().toISOString(),
        valor_fechamento_informado: valorInformado,
        valor_fechamento_sistema: saldoSistema,
        status: 'fechado',
        observacoes,
      })
      .eq('id', caixaId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as CaixaDiario
  },

  async getSummary(startDate: string, endDate: string, profissionalId?: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    let query = (supabase
      .from('transacao_caixa') as any)
      .select('tipo, valor, comissao_valor, agendamento:agendamento_id(profissional_id)')
      .eq('salao_id', usuario.salao_id)
      .eq('status', 'ativo')
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (profissionalId) {
      query = query.filter('agendamento.profissional_id', 'eq', profissionalId)
    }

    const { data, error } = await query

    if (error) throw error

    const entradas = (data as any[])
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0)

    const saidas = (data as any[])
      .filter((t) => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0)

    const comissoes = (data as any[])
      .filter((t) => t.tipo === 'entrada' && t.comissao_valor)
      .reduce((sum, t) => sum + Number(t.comissao_valor), 0)

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      comissoes,
    }
  },

  async getCaixasByPeriod(startDate: string, endDate: string): Promise<CaixaDiario[]> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('caixa_diario') as any)
      .select('*, usuario_abertura:usuario_abertura_id(nome), usuario_fechamento:usuario_fechamento_id(nome)')
      .eq('salao_id', usuario.salao_id)
      .gte('data_abertura', startDate)
      .lte('data_abertura', endDate)
      .order('data_abertura', { ascending: false })

    if (error) throw error
    return data as unknown as CaixaDiario[]
  },

  async getTransacoesByCaixa(caixaId: string): Promise<TransacaoCaixa[]> {
    const { data, error } = await (supabase
      .from('transacao_caixa') as any)
      .select(TRANSACAO_SELECT)
      .eq('caixa_id', caixaId)
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data as unknown as TransacaoCaixa[]
  },
}
