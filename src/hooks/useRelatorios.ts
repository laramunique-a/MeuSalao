import { useQuery } from '@tanstack/react-query'
import { relatoriosService } from '@/services/relatorios.service'

export function useClienteReport(clienteId: string | null) {
  return useQuery({
    queryKey: ['cliente-report', clienteId],
    queryFn: () => relatoriosService.getClienteReport(clienteId!),
    enabled: !!clienteId,
  })
}

export function useCaixaPendenciasReport() {
  return useQuery({
    queryKey: ['caixa-pendencias-report'],
    queryFn: () => relatoriosService.getCaixaPendenciasReport(),
  })
}

export function useFolhaPagamentoReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['folha-pagamento-report', startDate, endDate],
    queryFn: () => relatoriosService.getFolhaPagamentoReport(startDate, endDate),
  })
}

export function useSaldosComissoesReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['saldos-comissoes-report', startDate, endDate],
    queryFn: () => relatoriosService.getSaldosComissoesReport(startDate, endDate),
  })
}
