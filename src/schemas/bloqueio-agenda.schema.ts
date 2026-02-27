import { z } from 'zod'

export const bloqueioAgendaSchema = z.object({
  profissional_id: z.string().min(1, 'Profissional é obrigatório'),
  data_inicio: z.string().min(1, 'Data inicial é obrigatória'),
  data_fim: z.string().min(1, 'Data final é obrigatória'),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  horario_fim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  motivo: z.string().optional(),
}).refine(
  (data) => {
    const dataInicio = new Date(data.data_inicio)
    const dataFim = new Date(data.data_fim)
    return dataFim >= dataInicio
  },
  {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['data_fim'],
  }
).refine(
  (data) => {
    return data.horario_fim > data.horario_inicio
  },
  {
    message: 'Horário final deve ser maior que o horário inicial',
    path: ['horario_fim'],
  }
)

export type BloqueioAgendaFormData = z.infer<typeof bloqueioAgendaSchema>
