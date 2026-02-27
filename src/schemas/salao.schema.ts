import { z } from 'zod'

export const salaoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  logo_url: z.string().optional(),
  cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
})

export type SalaoFormData = z.infer<typeof salaoSchema>

export const CORES_PREDEFINIDAS = [
  { nome: 'Lavanda', valor: '#9D85C5' },
  { nome: 'Rosa Antigo', valor: '#D689A9' },
  { nome: 'Azul Sereno', valor: '#7192BE' },
  { nome: 'Verde Sálvia', valor: '#89A88D' },
  { nome: 'Terracota', valor: '#C98B75' },
  { nome: 'Rubi Suave', valor: '#C57B7B' },
  { nome: 'Brisa Marinha', valor: '#8FB9B1' },
  { nome: 'Índigo Soft', valor: '#7B88C3' },
]
