import { Json } from './database.types'

export interface Salao {
  id: string
  nome: string
  endereco: string | null
  telefone: string | null
  logo_url: string | null
  cor_primaria: string | null
  configuracoes: Json | null
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  salao_id: string
  auth_user_id: string
  nome: string
  email: string
  perfil: 'administrador' | 'funcionario'
  ativo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  salao_id: string
  nome: string
  telefone: string
  email: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Servico {
  id: string
  salao_id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_minutos: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type AgendamentoStatus = 'agendado' | 'confirmado' | 'em_atendimento' | 'em_atraso' | 'pendente_caixa' | 'concluido' | 'cancelado'

export interface Agendamento {
  id: string
  salao_id: string
  cliente_id: string
  profissional_id: string
  servico_id: string
  data_hora: string
  status: AgendamentoStatus
  valor: number
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  profissional?: Usuario
  servico?: Servico
}

export type FormaPagamento = 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'outros'

export interface TransacaoCaixa {
  id: string
  salao_id: string
  usuario_id: string
  agendamento_id: string | null
  tipo: 'entrada' | 'saida'
  valor: number
  forma_pagamento: FormaPagamento
  categoria: string | null
  descricao: string
  data_hora: string
  created_at: string
  usuario?: Usuario
  agendamento?: Agendamento
}

export interface BloqueioAgenda {
  id: string
  salao_id: string
  profissional_id: string
  data_inicio: string
  data_fim: string
  horario_inicio: string
  horario_fim: string
  motivo: string | null
  created_at: string
  updated_at: string
  profissional?: Usuario
}
