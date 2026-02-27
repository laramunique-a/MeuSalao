import * as z from 'zod'

export const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
