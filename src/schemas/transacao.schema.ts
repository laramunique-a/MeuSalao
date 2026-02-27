import * as z from 'zod'

export const transacaoSchema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  valor: z.string().min(1, 'Valor é obrigatório'),
  forma_pagamento: z.enum(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'outros']),
  categoria: z.string().optional(),
  descricao: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  agendamento_id: z.string().optional(),
  data_hora: z.string().optional(),
})

export type TransacaoFormData = z.infer<typeof transacaoSchema>
