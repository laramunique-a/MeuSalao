import { z } from 'zod'

export const usuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  perfil: z.enum(['administrador', 'funcionario']),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
})

export type UsuarioFormData = z.infer<typeof usuarioSchema>
