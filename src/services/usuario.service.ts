import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/types/database.types'

type Usuario = Database['public']['Tables']['usuario']['Row']
type UsuarioInsert = Database['public']['Tables']['usuario']['Insert']
type UsuarioUpdate = Database['public']['Tables']['usuario']['Update']

export const usuarioService = {
  async getUsuarios(): Promise<Usuario[]> {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('salao_id', usuario.salao_id as any)
      .neq('perfil', 'super_admin')
      .order('nome')

    if (error) throw error
    return data
  },

  async createUsuario(input: {
    nome: string
    email: string
    perfil: 'administrador' | 'profissional'
    pode_atender: boolean
    senha: string
    comissao_percentual?: number
  }): Promise<Usuario> {
    const adminUsuario = useAuthStore.getState().usuario
    if (!adminUsuario) throw new Error('Usuário não autenticado')

    // Realizar o signUp diretamente via fetch para garantir isolamento TOTAL da sessão global
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.senha,
        data: {
          nome: input.nome,
        },
      }),
    })

    const authResult = await response.json()

    if (!response.ok) {
      if (authResult.msg?.includes('already registered')) {
        throw new Error('Este email já está cadastrado no sistema. Se o erro persistir, o acesso pode ter sido criado parcialmente em uma tentativa anterior que falhou.')
      }
      throw new Error(authResult.msg || authResult.error_description || 'Erro ao criar conta de acesso.')
    }

    const authUser = authResult
    if (!authUser.user) throw new Error('Erro ao criar usuário de autenticação (sem dados do usuário)')

    const usuarioInsert: UsuarioInsert = {
      salao_id: adminUsuario.salao_id,
      auth_user_id: authUser.user.id,
      nome: input.nome,
      email: input.email,
      perfil: input.perfil,
      pode_atender: input.pode_atender,
      comissao_percentual: input.comissao_percentual || 0,
      ativo: true,
    }

    const { data, error } = await (supabase
      .from('usuario') as any)
      .insert(usuarioInsert)
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
        throw new Error('Erro de permissão: Apenas administradores podem cadastrar novos usuários e você deve pertencer ao mesmo salão.')
      }
      throw error
    }
    return data as unknown as Usuario
  },

  async updateUsuario(id: string, updates: Partial<UsuarioUpdate>): Promise<Usuario> {
    const { data, error } = await (supabase
      .from('usuario') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Usuario
  },

  async toggleAtivo(id: string, ativo: boolean): Promise<Usuario> {
    return this.updateUsuario(id, { ativo })
  },

  async deleteUsuario(id: string): Promise<void> {
    const { error } = await (supabase
      .from('usuario') as any)
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42501') {
        throw new Error('Erro de permissão: apenas administradores podem excluir usuários.')
      }
      throw error
    }
  },
}
