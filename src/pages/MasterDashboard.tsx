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
import { Plus, Users, Scissors, Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'

export default function MasterDashboard() {
  const [saloes, setSaloes] = useState<Salao[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
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
    fetchSaloes()
  }, [])

  async function fetchSaloes() {
    try {
      const { data, error } = await supabase
        .from('salao')
        .select('*')
        .order('nome')
      
      if (error) throw error
      setSaloes(data || [])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar salões',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSalao(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Criar o Salão
      const { error: salaoError } = await supabase
        .from('salao')
        .insert({
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco,
          email_dono: formData.email_dono
        } as any)

      if (salaoError) throw salaoError

      toast({
        title: 'Salão criado com sucesso!',
        description: 'Agora você precisa convidar o dono para acessar.',
      })

      setIsModalOpen(false)
      setFormData({ nome: '', email_dono: '', telefone: '', endereco: '' })
      fetchSaloes()
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
      // 1. Atualizar o vínculo do administrador no banco de dados
      const { error } = await (supabase
        .from('usuario') as any)
        .update({ salao_id: salaoId })
        .eq('id', usuario.id)

      if (error) throw error

      // 2. Recarregar perfil do usuário para atualizar o contexto local (salao_id)
      await authService.getCurrentUser()

      // 3. Limpar cache do salão e localStorage para forçar atualização total da UI
      await queryClient.resetQueries({ queryKey: ['salao'] })
      queryClient.invalidateQueries() // Invalida todas as outras listas (clientes, agendamentos, etc)
      
      // Limpar os dados prévios do localStorage que podem estar sendo exibidos no header
      localStorage.removeItem('salao_nome')
      localStorage.removeItem('salao_logo')
      localStorage.removeItem('salao_cor')

      toast({
        title: 'Estabelecimento alterado',
        description: 'Contexto de gerenciamento alterado com sucesso.',
      })

      // 4. Voltar para a agenda/dashboard do novo estabelecimento
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Master</h1>
          <p className="text-muted-foreground">
            Gerenciamento global de todos os salões da plataforma.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Salão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateSalao}>
              <DialogHeader>
                <DialogTitle>Novo Salão</DialogTitle>
                <DialogDescription>
                  Cadastre um novo salão na plataforma. O dono receberá um convite por e-mail.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Salão</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Salão da Maria"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail do Dono</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email_dono}
                    onChange={e => setFormData({ ...formData, email_dono: e.target.value })}
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço (opcional)</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
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
          <Card key={salao.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {salao.nome}
              </CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium text-primary mb-1">
                Dono: { (salao as any).email_dono || 'Não vinculado' }
              </div>
              <div className="text-xs text-muted-foreground">
                {salao.endereco || 'Endereço não informado'}
              </div>
              
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  -- clientes
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  -- agendamentos
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  variant={currentSalaoId === salao.id ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleGerenciar(salao.id)}
                  disabled={switchingId === salao.id || currentSalaoId === salao.id}
                >
                  {switchingId === salao.id ? <Loader2 className="h-4 w-4 animate-spin" /> : currentSalaoId === salao.id ? "Ativo" : "Gerenciar"}
                </Button>
                <Button variant="secondary" size="sm">
                  Convidar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {saloes.length === 0 && !loading && (
        <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Nenhum salão cadastrado ainda.</p>
        </div>
      )}
    </div>
  )
}
