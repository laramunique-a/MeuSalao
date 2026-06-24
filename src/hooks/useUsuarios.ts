import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuarioService } from '@/services/usuario.service'
import type { Database } from '@/types/database.types'

type UsuarioUpdate = Database['public']['Tables']['usuario']['Update']

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuarioService.getUsuarios(),
  })
}

export function useCreateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      nome: string
      email: string
      perfil: 'administrador' | 'profissional'
      pode_atender: boolean
      senha: string
      comissao_percentual?: number
    }) => usuarioService.createUsuario(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UsuarioUpdate> }) =>
      usuarioService.updateUsuario(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useToggleAtivoUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      usuarioService.toggleAtivo(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usuarioService.deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['profissionais'] })
    },
  })
}
