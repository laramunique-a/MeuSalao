import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bloqueioAgendaService } from '@/services/bloqueio-agenda.service'
import type { BloqueioAgenda } from '@/types/models'

export function useBloqueios() {
  return useQuery({
    queryKey: ['bloqueios'],
    queryFn: () => bloqueioAgendaService.getAll(),
  })
}

export function useBloqueiosByProfissionalAndDateRange(
  profissionalId: string | undefined,
  dataInicio: string,
  dataFim: string
) {
  return useQuery({
    queryKey: ['bloqueios', profissionalId, dataInicio, dataFim],
    queryFn: () =>
      profissionalId
        ? bloqueioAgendaService.getByProfissionalAndDateRange(profissionalId, dataInicio, dataFim)
        : Promise.resolve([]),
    enabled: !!profissionalId,
  })
}

export function useBloqueiosByDateRange(
  dataInicio: string,
  dataFim: string
) {
  return useQuery({
    queryKey: ['bloqueios', dataInicio, dataFim],
    queryFn: () => bloqueioAgendaService.getByDateRange(dataInicio, dataFim),
  })
}

export function useCreateBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<BloqueioAgenda, 'id' | 'created_at' | 'updated_at'>) =>
      bloqueioAgendaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
    },
  })
}

export function useUpdateBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<BloqueioAgenda, 'id' | 'created_at' | 'updated_at'>> }) =>
      bloqueioAgendaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
    },
  })
}

export function useDeleteBloqueio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bloqueioAgendaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
    },
  })
}

export function useCheckBloqueio() {
  return useMutation({
    mutationFn: ({ profissionalId, dataHora }: { profissionalId: string; dataHora: string }) =>
      bloqueioAgendaService.checkBloqueio(profissionalId, dataHora),
  })
}
