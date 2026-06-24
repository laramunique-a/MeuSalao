export const APP_NAME = 'MeuSalão'
export const APP_DESCRIPTION = 'Sistema de Gestão de Salão de Beleza'

export const PERFIS = {
  ADMINISTRADOR: 'administrador' as const,
  PROFISSIONAL: 'profissional' as const,
}

export const STATUS_AGENDAMENTO = {
  AGENDADO: 'agendado' as const,
  CONFIRMADO: 'confirmado' as const,
  EM_ATENDIMENTO: 'em_atendimento' as const,
  EM_ATRASO: 'em_atraso' as const,
  PENDENTE_CAIXA: 'pendente_caixa' as const,
  CONCLUIDO: 'concluido' as const,
  CANCELADO: 'cancelado' as const,
}

export const FORMAS_PAGAMENTO = {
  DINHEIRO: 'dinheiro' as const,
  CARTAO_DEBITO: 'cartao_debito' as const,
  CARTAO_CREDITO: 'cartao_credito' as const,
  PIX: 'pix' as const,
  OUTROS: 'outros' as const,
}

export const FORMAS_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  pix: 'PIX',
  outros: 'Outros',
}

export const STATUS_AGENDAMENTO_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em Atendimento',
  em_atraso: 'Em Atraso',
  pendente_caixa: 'Pendente Caixa',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const STATUS_AGENDAMENTO_COLORS: Record<string, string> = {
  agendado: 'bg-blue-500',
  confirmado: 'bg-green-500',
  em_atendimento: 'bg-yellow-500',
  em_atraso: 'bg-orange-500',
  pendente_caixa: 'bg-purple-500',
  concluido: 'bg-green-700',
  cancelado: 'bg-red-500',
}
