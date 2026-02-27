import * as z from 'zod'

export const agendamentoSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  profissional_id: z.string().min(1, 'Profissional é obrigatório'),
  servico_id: z.string().min(1, 'Serviço é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  observacoes: z.string().optional(),
})

export type AgendamentoFormData = z.infer<typeof agendamentoSchema>
