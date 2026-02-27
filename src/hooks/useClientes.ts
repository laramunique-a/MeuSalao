import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteService } from '@/services/cliente.service'
import type { Cliente } from '@/types/models'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteService.getAll(),
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clienteService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cliente: Omit<Cliente, 'id' | 'salao_id' | 'created_at' | 'updated_at'>) =>
      clienteService.create(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cliente> }) =>
      clienteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useSearchClientes(termo: string) {
  return useQuery({
    queryKey: ['clientes', 'search', termo],
    queryFn: () => clienteService.search(termo),
    enabled: termo.length > 0,
  })
}
