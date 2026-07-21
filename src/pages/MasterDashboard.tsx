import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Salao } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Scissors, Loader2, Trash2, Edit2, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'

export default function MasterDashboard() {
  const [saloes, setSaloes] = useState<Salao[]>([])
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  
  // Edit State
  const [editingSalao, setEditingSalao] = useState<Salao | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nome: '',
    email_dono: '',
    telefone: '',
    endereco: ''
  })
  const [selectedDonoUsuarioId, setSelectedDonoUsuarioId] = useState<string>('none')

  const navigate = useNavigate()
  const currentSalaoId = useAuthStore(state => state.usuario?.salao_id)
  const queryClient = useQueryClient()
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email_dono: '',
    telefone: '',
    endereco: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchSaloes(), fetchUsuarios()]).finally(() => setLoading(false))
  }, [])

  async function fetchSaloes() {
    try {
      const { data, error } = await supabase
        .from('salao')
        .select('*')
        .order('nome')
      
      if (error) throw error
      setSaloes((data || []) as unknown as Salao[])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar salões',
        description: error.message
      })
    }
  }

  async function fetchUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('id, nome, email')
        .order('nome')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error.message)
    }
  }

  function startEdit(salao: Salao) {
    setEditingSalao(salao)
    setEditFormData({
      nome: salao.nome,
      email_dono: (salao as any).email_dono || '',
      telefone: salao.telefone || '',
      endereco: salao.endereco || ''
    })
    
    const matchingUser = usuarios.find(u => u.email === (salao as any).email_dono)
    setSelectedDonoUsuarioId(matchingUser ? matchingUser.id : 'none')
    
    setIsEditModalOpen(true)
  }

  async function handleEditSalao(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSalao) return
    setIsSubmitting(true)

    try {
      let finalEmailDono = editFormData.email_dono

      // Se um usuário foi selecionado como dono
      if (selectedDonoUsuarioId !== 'none') {
        const donoUser = usuarios.find(u => u.id === selectedDonoUsuarioId)
        if (donoUser) {
          finalEmailDono = donoUser.email
          
          // Vincula o usuário ao salão e eleva para administrador
          const { error: userError } = await (supabase
            .from('usuario') as any)
            .update({ 
              salao_id: editingSalao.id,
              perfil: 'administrador'
            })
            .eq('id', donoUser.id)

          if (userError) throw userError
        }
      } else if (finalEmailDono) {
        // Se e-mail foi digitado e existe usuário com esse e-mail no sistema
        const { data: matchedUsers } = await (supabase
          .from('usuario') as any)
          .select('id')
          .eq('email', finalEmailDono.trim())
          .limit(1)

        if (matchedUsers && matchedUsers.length > 0) {
          const { error: userError } = await (supabase
            .from('usuario') as any)
            .update({ 
              salao_id: editingSalao.id,
              perfil: 'administrador'
            })
            .eq('id', (matchedUsers[0] as any).id)

          if (userError) throw userError
        }
      }

      // Atualiza os dados do salão
      const { error: salaoError } = await (supabase
        .from('salao') as any)
        .update({
          nome: editFormData.nome,
          telefone: editFormData.telefone,
          endereco: editFormData.endereco,
          email_dono: finalEmailDono
        })
        .eq('id', editingSalao.id)

      if (salaoError) throw salaoError

      toast({
        title: 'Estabelecimento atualizado com sucesso!',
        description: 'Os dados e o vínculo de proprietário foram salvos.',
      })

      setIsEditModalOpen(false)
      setEditingSalao(null)
      fetchSaloes()
      fetchUsuarios()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar salão',
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSalao(salaoId: string, salaoNome: string) {
    if (!window.confirm(`ATENÇÃO: Você tem certeza de que deseja excluir permanentemente o estabelecimento "${salaoNome}"?\n\nEsta ação apagará de forma irreversível todas as transações, agendamentos, serviços, clientes e usuários contratados por este salão.`)) {
      return
    }

    setSwitchingId(salaoId)
    try {
      // Limpeza manual encadeada
      await (supabase.from('transacao_caixa') as any).delete().eq('salao_id', salaoId)
      await (supabase.from('caixa_diario') as any).delete().eq('salao_id', salaoId)
      await (supabase.from('agendamento') as any).delete().eq('salao_id', salaoId)
      await (supabase.from('bloqueio_agenda') as any).delete().eq('salao_id', salaoId)
      await (supabase.from('servico') as any).delete().eq('salao_id', salaoId)
      await (supabase.from('cliente') as any).delete().eq('salao_id', salaoId)
      
      const currentUser = useAuthStore.getState().usuario
      await (supabase.from('usuario') as any).delete().eq('salao_id', salaoId).neq('id', currentUser?.id)

      const { error: salaoError } = await (supabase.from('salao') as any).delete().eq('id', salaoId)
      if (salaoError) throw salaoError

      toast({
        title: 'Estabelecimento excluído',
        description: `O salão "${salaoNome}" e todos os seus dados foram apagados com sucesso.`,
      })
      
      if (currentSalaoId === salaoId) {
        const usuario = useAuthStore.getState().usuario
        if (usuario) {
          await (supabase.from('usuario') as any).update({ salao_id: null }).eq('id', usuario.id)
          await authService.getCurrentUser()
          queryClient.resetQueries({ queryKey: ['salao'] })
          queryClient.invalidateQueries()
        }
      }

      fetchSaloes()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir salão',
        description: error.message
      })
    } finally {
      setSwitchingId(null)
    }
  }

  async function handleCreateSalao(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: newSalao, error: salaoError } = await (supabase
        .from('salao') as any)
        .insert({
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco,
          email_dono: formData.email_dono
        })
        .select('id')
        .single()

      if (salaoError) throw salaoError

      if (formData.email_dono && newSalao) {
        const { data: matchedUsers } = await (supabase
          .from('usuario') as any)
          .select('id')
          .eq('email', formData.email_dono.trim())
          .limit(1)

        if (matchedUsers && matchedUsers.length > 0) {
          await (supabase
            .from('usuario') as any)
            .update({ 
              salao_id: (newSalao as any).id,
              perfil: 'administrador'
            })
            .eq('id', (matchedUsers[0] as any).id)
        }
      }

      toast({
        title: 'Salão criado com sucesso!',
        description: 'O salão foi cadastrado e o dono associado, se já possuir conta.',
      })

      setIsModalOpen(false)
      setFormData({ nome: '', email_dono: '', telefone: '', endereco: '' })
      fetchSaloes()
      fetchUsuarios()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar salão',
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGerenciar(salaoId: string) {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) return
    
    setSwitchingId(salaoId)
    try {
      const { error } = await (supabase
        .from('usuario') as any)
        .update({ salao_id: salaoId })
        .eq('id', usuario.id)

      if (error) throw error

      await authService.getCurrentUser()

      await queryClient.resetQueries({ queryKey: ['salao'] })
      queryClient.invalidateQueries()
      
      localStorage.removeItem('salao_nome')
      localStorage.removeItem('salao_logo')
      localStorage.removeItem('salao_cor')

      toast({
        title: 'Estabelecimento alterado',
        description: 'Contexto de gerenciamento alterado com sucesso.',
      })

      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao mudar estabelecimento',
        description: error.message
      })
    } finally {
      setSwitchingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-20" />
      </div>
    )
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Painel Master</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Gerenciamento global de todos os salões da plataforma.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Salão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] border-border bg-background">
            <form onSubmit={handleCreateSalao}>
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold uppercase tracking-wider">Novo Salão</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Cadastre um novo salão na plataforma. O dono receberá um convite por e-mail.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-xs">
                <div className="grid gap-2">
                  <Label htmlFor="nome" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome do Salão</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Salão da Maria"
                    className="h-10 rounded-lg border-border bg-background text-xs"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">E-mail do Dono</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email_dono}
                    onChange={e => setFormData({ ...formData, email_dono: e.target.value })}
                    placeholder="exemplo@email.com"
                    className="h-10 rounded-lg border-border bg-background text-xs"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-10 rounded-lg border-border bg-background text-xs"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Endereço (opcional)</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Número, Bairro"
                    className="h-10 rounded-lg border-border bg-background text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="text-xs uppercase tracking-wider h-9">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar Salão
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {saloes.map((salao) => (
          <Card key={salao.id} className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {salao.nome}
              </CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                Dono: { (salao as any).email_dono || 'Não vinculado' }
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {salao.endereco || 'Endereço não informado'}
              </div>
 
              <div className="flex flex-col gap-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={currentSalaoId === salao.id ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleGerenciar(salao.id)}
                    disabled={switchingId === salao.id || currentSalaoId === salao.id}
                    className="text-[10px] uppercase tracking-wider h-8 w-full"
                  >
                    {switchingId === salao.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentSalaoId === salao.id ? "Ativo" : "Gerenciar"}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => startEdit(salao)}
                    className="text-[10px] uppercase tracking-wider h-8 w-full flex items-center justify-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteSalao(salao.id, salao.nome)}
                  disabled={switchingId === salao.id}
                  className="text-[10px] uppercase tracking-wider h-8 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir Salão
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {saloes.length === 0 && !loading && (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Nenhum salão cadastrado ainda.</p>
        </div>
      )}

      {/* Modal de Edição de Salão / Vínculo de Dono */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[450px] border-border bg-background">
          <form onSubmit={handleEditSalao}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-primary" />
                Editar Estabelecimento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Atualize os dados do salão e alterne ou vincule o proprietário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-xs">
              <div className="grid gap-2">
                <Label htmlFor="edit-nome" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome do Salão</Label>
                <Input
                  id="edit-nome"
                  required
                  value={editFormData.nome}
                  onChange={e => setEditFormData({ ...editFormData, nome: e.target.value })}
                  className="h-10 rounded-lg border-border bg-background text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vincular Dono Existente</Label>
                <select
                  value={selectedDonoUsuarioId}
                  onChange={e => {
                    const val = e.target.value
                    setSelectedDonoUsuarioId(val)
                    if (val !== 'none') {
                      const matched = usuarios.find(u => u.id === val)
                      if (matched) {
                        setEditFormData(prev => ({ ...prev, email_dono: matched.email }))
                      }
                    }
                  }}
                  className="h-10 rounded-lg border border-border bg-background text-xs px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="none">-- Escolher usuário cadastrado na plataforma --</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">E-mail do Dono (Manual/Fallback)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  required
                  value={editFormData.email_dono}
                  onChange={e => setEditFormData({ ...editFormData, email_dono: e.target.value })}
                  placeholder="dono@email.com"
                  disabled={selectedDonoUsuarioId !== 'none'}
                  className="h-10 rounded-lg border-border bg-background text-xs disabled:opacity-50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-telefone" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={editFormData.telefone}
                  onChange={e => setEditFormData({ ...editFormData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-10 rounded-lg border-border bg-background text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-endereco" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={editFormData.endereco}
                  onChange={e => setEditFormData({ ...editFormData, endereco: e.target.value })}
                  placeholder="Rua, Número, Bairro"
                  className="h-10 rounded-lg border-border bg-background text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="text-xs uppercase tracking-wider h-9">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
