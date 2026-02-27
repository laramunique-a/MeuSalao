import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicoService } from '@/services/servico.service'
import type { Servico } from '@/types/models'

export function useServicos() {
  return useQuery({
    queryKey: ['servicos'],
    queryFn: () => servicoService.getAll(),
  })
}

export function useServico(id: string) {
  return useQuery({
    queryKey: ['servico', id],
    queryFn: () => servicoService.getById(id),
    enabled: !!id,
  })
}

export function useCreateServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (servico: Omit<Servico, 'id' | 'salao_id' | 'created_at' | 'updated_at'>) =>
      servicoService.create(servico),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    },
  })
}

export function useUpdateServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Servico> }) =>
      servicoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    },
  })
}

export function useDeleteServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => servicoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    },
  })
}

export function useToggleServicoAtivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      servicoService.toggleAtivo(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    },
  })
}
