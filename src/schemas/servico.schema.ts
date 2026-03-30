import * as z from 'zod'

export const servicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  valor: z.string().min(1, 'Valor é obrigatório'),
  duracao_minutos: z.string().min(1, 'Duração é obrigatória'),
  comissao_percentual: z.string().optional().default('0'),
  ativo: z.boolean().default(true),
})

export type ServicoFormData = z.infer<typeof servicoSchema>
