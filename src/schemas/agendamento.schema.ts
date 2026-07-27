import * as z from 'zod'

export const agendamentoItemSchema = z.object({
  servico_id: z.string().min(1, 'Selecione o serviço'),
  profissional_id: z.string().min(1, 'Selecione o profissional'),
})

export const agendamentoSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  profissional_id: z.string().optional(),
  servico_id: z.string().optional(),
  data: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  observacoes: z.string().optional(),
  itens: z.array(agendamentoItemSchema).optional(),
})

export type AgendamentoFormData = z.infer<typeof agendamentoSchema>
