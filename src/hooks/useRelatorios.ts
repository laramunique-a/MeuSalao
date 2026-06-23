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

export function useFolhaPagamentoReport() {
  return useQuery({
    queryKey: ['folha-pagamento-report'],
    queryFn: () => relatoriosService.getFolhaPagamentoReport(),
  })
}
