import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salaoService } from '@/services/salao.service'
import type { Database } from '@/types/database.types'

type SalaoUpdate = Database['public']['Tables']['salao']['Update']

export function useSalao() {
  const query = useQuery({
    queryKey: ['salao'],
    queryFn: () => salaoService.getSalao(),
  })

  // Sincronizar dados com localStorage para evitar flash no carregamento
  if (query.data) {
    localStorage.setItem('salao_nome', query.data.nome)
    if (query.data.logo_url) localStorage.setItem('salao_logo', query.data.logo_url)
    if (query.data.cor_primaria) localStorage.setItem('salao_cor', query.data.cor_primaria)
  }

  return query
}

export function useUpdateSalao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<SalaoUpdate>) => salaoService.updateSalao(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salao'] })
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => salaoService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salao'] })
    },
  })
}
