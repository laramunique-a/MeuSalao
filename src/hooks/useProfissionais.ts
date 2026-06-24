import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Usuario } from '@/types/models'

async function getProfissionais(): Promise<Usuario[]> {
  const usuario = useAuthStore.getState().usuario
  if (!usuario || !usuario.salao_id) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('salao_id', usuario.salao_id)
    .eq('ativo', true)
    .eq('pode_atender', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return data as Usuario[]
}

export function useProfissionais() {
  return useQuery({
    queryKey: ['profissionais'],
    queryFn: getProfissionais,
  })
}
