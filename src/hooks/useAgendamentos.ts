import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agendamentoService } from '@/services/agendamento.service'
import type { Agendamento } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => agendamentoService.getAll(),
  })
}

export function useAgendamentosByDate(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['agendamentos', 'date', startDate, endDate],
    queryFn: () => agendamentoService.getByDate(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export function useAgendamento(id: string) {
  return useQuery({
    queryKey: ['agendamento', id],
    queryFn: () => agendamentoService.getById(id),
    enabled: !!id,
  })
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agendamento: Omit<Agendamento, 'id' | 'salao_id' | 'created_at' | 'updated_at'>) =>
      agendamentoService.create(agendamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export function useUpdateAgendamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agendamento> }) =>
      agendamentoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export function useUpdateAgendamentoStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Agendamento['status'] }) =>
      agendamentoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export function useDeleteAgendamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => agendamentoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

export function useCheckConflict() {
  return useMutation({
    mutationFn: ({
      profissionalId,
      dataHora,
      duracaoMinutos,
      excludeId,
    }: {
      profissionalId: string
      dataHora: string
      duracaoMinutos: number
      excludeId?: string
    }) => agendamentoService.checkConflict(profissionalId, dataHora, duracaoMinutos, excludeId),
  })
}

export function useAgendamentosEmAtendimento(startDate: string, endDate: string) {
  const { usuario, isAdmin } = useAuthStore()
  return useQuery({
    queryKey: ['agendamentos', 'pendentes_baixa', startDate, endDate, isAdmin ? 'all' : usuario?.id],
    queryFn: () => agendamentoService.getAgendamentosSemBaixa(startDate, endDate, isAdmin ? undefined : usuario?.id),
    enabled: !!startDate && !!endDate,
    refetchInterval: 30000,
  })
}
export function useHasPendencias() {
  const { usuario, isAdmin } = useAuthStore()
  return useQuery({
    queryKey: ['agendamentos', 'has_pendencias', isAdmin ? 'all' : usuario?.id],
    queryFn: () => agendamentoService.hasAnyPendencia(isAdmin ? undefined : usuario?.id),
    refetchInterval: 30000,
  })
}

export function usePendenciasGlobais() {
  return useQuery({
    queryKey: ['agendamentos', 'pendencias-globais'],
    queryFn: () => agendamentoService.getPendenciasGlobais(),
  })
}
