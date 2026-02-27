import { supabase } from '@/lib/supabase'
import type { Salao } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export const salaoService = {
  async getSalao(): Promise<Salao | null> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('salao')
      .select('*')
      .eq('id', usuario.salao_id)
      .single()

    if (error) throw error
    return data as Salao
  },

  async updateSalao(updates: Partial<Salao>): Promise<Salao> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await (supabase
      .from('salao') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', usuario.salao_id)
      .select()
      .single()

    if (error) throw error
    return data as Salao
  },

  async uploadLogo(file: File): Promise<string> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const fileExt = file.name.split('.').pop()
    const fileName = `${usuario.salao_id}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('salao-logos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('salao-logos')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  },
}
