import { z } from 'zod'

export const usuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  perfil: z.enum(['administrador', 'profissional']),
  comissao_percentual: z.string().optional().default('0').refine(
    (val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Comissão deve ser entre 0 e 100'
  ),
  senha: z.string().optional().refine(
    (val) => !val || val.length >= 6,
    'Senha deve ter no mínimo 6 caracteres'
  ),
})

export type UsuarioFormData = z.infer<typeof usuarioSchema>
