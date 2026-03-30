import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { caixaService } from '@/services/caixa.service'
import type { TransacaoCaixa } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export function useTransacoes() {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: () => caixaService.getAll(),
  })
}

export function useTransacoesByDate(startDate: string, endDate: string) {
  const { usuario, isAdmin } = useAuthStore()
  return useQuery({
    queryKey: ['transacoes', 'date', startDate, endDate, isAdmin ? 'all' : usuario?.id],
    queryFn: () => caixaService.getByDate(startDate, endDate, isAdmin ? undefined : usuario?.id),
    enabled: !!startDate && !!endDate,
  })
}

export function useTransacao(id: string) {
  return useQuery({
    queryKey: ['transacao', id],
    queryFn: () => caixaService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTransacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transacao: Omit<TransacaoCaixa, 'id' | 'salao_id' | 'usuario_id' | 'created_at'>) =>
      caixaService.create(transacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-summary'] })
    },
  })
}

export function useDeleteTransacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => caixaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-summary'] })
    },
  })
}

export function useCaixaSummary(startDate: string, endDate: string) {
  const { usuario, isAdmin } = useAuthStore()
  return useQuery({
    queryKey: ['caixa-summary', startDate, endDate, isAdmin ? 'all' : usuario?.id],
    queryFn: () => caixaService.getSummary(startDate, endDate, isAdmin ? undefined : usuario?.id),
    enabled: !!startDate && !!endDate,
  })
}

export function useCaixaAberto() {
  return useQuery({
    queryKey: ['caixa-aberto'],
    queryFn: () => caixaService.getCaixaAberto(),
  })
}

export function useLastClosedCaixa() {
  return useQuery({
    queryKey: ['caixa-last-closed'],
    queryFn: () => caixaService.getLastClosedCaixa(),
  })
}

export function useCaixasByPeriod(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['caixas-period', startDate, endDate],
    queryFn: () => caixaService.getCaixasByPeriod(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export function useTransacoesByCaixa(caixaId: string | null) {
  return useQuery({
    queryKey: ['transacoes-caixa', caixaId],
    queryFn: () => caixaService.getTransacoesByCaixa(caixaId!),
    enabled: !!caixaId,
  })
}

export function useAbrirCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ valorInicial, observacoes }: { valorInicial: number; observacoes?: string }) =>
      caixaService.abrirCaixa(valorInicial, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] })
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-summary'] })
    },
  })
}

export function useFecharCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caixaId, valorInformado, observacoes }: { caixaId: string; valorInformado: number; observacoes?: string }) =>
      caixaService.fecharCaixa(caixaId, valorInformado, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-aberto'] })
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-summary'] })
    },
  })
}

export function useEstornarTransacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => caixaService.estornar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
      queryClient.invalidateQueries({ queryKey: ['caixa-summary'] })
    },
  })
}
