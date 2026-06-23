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
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate">
                Dono: { (salao as any).email_dono || 'Não vinculado' }
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {salao.endereco || 'Endereço não informado'}
              </div>
              
              <div className="flex gap-4 mt-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  -- clientes
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  -- agendamentos
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  variant={currentSalaoId === salao.id ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleGerenciar(salao.id)}
                  disabled={switchingId === salao.id || currentSalaoId === salao.id}
                  className="text-[10px] uppercase tracking-wider h-8"
                >
                  {switchingId === salao.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentSalaoId === salao.id ? "Ativo" : "Gerenciar"}
                </Button>
                <Button variant="secondary" size="sm" className="text-[10px] uppercase tracking-wider h-8">
                  Convidar
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
    </div>
  )
}
