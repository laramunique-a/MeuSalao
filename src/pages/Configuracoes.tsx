import { useState } from 'react'
import { useSalao } from '@/hooks/useSalao'
import { useUsuarios } from '@/hooks/useUsuarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalaoForm } from '@/components/configuracoes/SalaoForm'
import { UsuarioFormDialog } from '@/components/configuracoes/UsuarioFormDialog'
import { UsuariosTable } from '@/components/configuracoes/UsuariosTable'
import { TaxasCartaoForm } from '@/components/configuracoes/TaxasCartaoForm'
import { Building2, Users, Plus, Loader2, CreditCard, Scissors } from 'lucide-react'

// Imports para Serviços
import { useServicos, useDeleteServico, useToggleServicoAtivo } from '@/hooks/useServicos'
import { ServicoFormDialog } from '@/components/servicos/ServicoFormDialog'
import { ServicosTable } from '@/components/servicos/ServicosTable'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Servico } from '@/types/models'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const { toast } = useToast()
  
  // Usuários states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<any>(null)
  
  const { data: salao, isLoading: loadingSalao } = useSalao()
  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios()

  // Serviços states
  const [isServicoFormOpen, setIsServicoFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [isServicoDeleteDialogOpen, setIsServicoDeleteDialogOpen] = useState(false)
  const [servicoToDelete, setServicoToDelete] = useState<Servico | null>(null)

  const { data: servicos = [], isLoading: loadingServicos } = useServicos()
  const deleteServico = useDeleteServico()
  const toggleServicoAtivo = useToggleServicoAtivo()

  const handleEdit = (usuario: any) => {
    setUsuarioParaEditar(usuario)
    setDialogOpen(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setUsuarioParaEditar(null)
  }

  // Serviços handlers
  function handleEditServico(servico: Servico) {
    setSelectedServico(servico)
    setIsServicoFormOpen(true)
  }

  function handleDeleteServico(servico: Servico) {
    setServicoToDelete(servico)
    setIsServicoDeleteDialogOpen(true)
  }

  async function confirmDeleteServico() {
    if (!servicoToDelete) return

    try {
      await deleteServico.mutateAsync(servicoToDelete.id)
      toast({
        title: 'Serviço excluído!',
        description: 'O serviço foi removido com sucesso.',
      })
      setIsServicoDeleteDialogOpen(false)
      setServicoToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir serviço',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function handleToggleServicoAtivo(servico: Servico) {
    try {
      await toggleServicoAtivo.mutateAsync({
        id: servico.id,
        ativo: !servico.ativo,
      })
      toast({
        title: servico.ativo ? 'Serviço desativado' : 'Serviço ativado',
        description: `O serviço "${servico.nome}" foi ${servico.ativo ? 'desativado' : 'ativado'}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  function handleCloseServicoForm() {
    setIsServicoFormOpen(false)
    setSelectedServico(null)
  }

  const servicosAtivos = servicos.filter((s) => s.ativo).length
  const servicosInativos = servicos.filter((s) => !s.ativo).length

  if (loadingSalao) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!salao) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 py-6">
        <div className="text-center py-16 bg-red-500/10 rounded-lg border border-border">
          <p className="text-red-500 font-semibold uppercase tracking-wider text-xs">
            Erro ao carregar dados do estabelecimento. Por favor, tente novamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Configurações</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Gerencie as informações do salão, serviços, equipe e financeiro.
          </p>
        </div>
      </div>

      <Tabs defaultValue="salao" className="space-y-6">
        {/* Tab Navigation - Caixa Submenu Pattern */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-card p-3 rounded-lg border border-border">
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5 w-fit">
            <TabsList className="bg-transparent h-8 gap-0 p-0">
              <TabsTrigger 
                value="salao" 
                className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold text-muted-foreground hover:text-foreground shadow-none"
              >
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                Dados do Salão
              </TabsTrigger>
              <TabsTrigger 
                value="servicos" 
                className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold text-muted-foreground hover:text-foreground shadow-none"
              >
                <Scissors className="h-3.5 w-3.5 mr-1.5" />
                Serviços
              </TabsTrigger>
              <TabsTrigger 
                value="usuarios" 
                className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold text-muted-foreground hover:text-foreground shadow-none"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Usuários 
                <span className="ml-2 px-1.5 py-0.5 bg-accent text-[9px] rounded-full font-bold border border-border">{usuarios.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financeiro" 
                className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold text-muted-foreground hover:text-foreground shadow-none"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Financeiro
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="salao" className="mt-0 outline-none">
          <div className="max-w-[720px] mx-auto">
            <SalaoForm salao={salao} />
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="mt-0 outline-none">
          <Card className="border border-border overflow-hidden rounded-lg bg-card">
            <CardHeader className="border-b border-border bg-accent/20 py-4 px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">Serviços e Preços</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Gerencie os serviços oferecidos, valores e tempos estimados.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="h-7 px-3 text-[10px] font-medium border border-border text-muted-foreground bg-background rounded-full">
                      Total: <span className="font-semibold text-foreground ml-1">{servicos.length}</span>
                    </Badge>
                    <Badge variant="secondary" className="h-7 px-3 text-[10px] font-medium border border-border text-muted-foreground bg-background rounded-full">
                      Ativos: <span className="font-semibold text-foreground ml-1">{servicosAtivos}</span>
                    </Badge>
                    <Badge variant="secondary" className="h-7 px-3 text-[10px] font-medium border border-border text-muted-foreground bg-background rounded-full">
                      Inativos: <span className="font-semibold text-foreground ml-1">{servicosInativos}</span>
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedServico(null)
                      setIsServicoFormOpen(true)
                    }}
                    className="h-9 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingServicos ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                </div>
              ) : (
                <div className="px-6 py-6">
                  <ServicosTable
                    servicos={servicos}
                    onEdit={handleEditServico}
                    onDelete={handleDeleteServico}
                    onToggleAtivo={handleToggleServicoAtivo}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0 outline-none">
          <Card className="border border-border overflow-hidden rounded-lg bg-card">
            <CardHeader className="border-b border-border bg-accent/20 py-4 px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">Equipe e Acesso</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Gerencie os acessos do sistema e níveis de permissão.</p>
                </div>
                <Button 
                  onClick={() => {
                    setUsuarioParaEditar(null)
                    setDialogOpen(true)
                  }}
                  className="h-9 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsuarios ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                </div>
              ) : (
                <div className="px-6 py-6">
                  <UsuariosTable usuarios={usuarios} onEdit={handleEdit} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-0 outline-none">
          <div className="max-w-[720px] mx-auto">
            <TaxasCartaoForm salao={salao} />
          </div>
        </TabsContent>
      </Tabs>

      <UsuarioFormDialog 
        open={dialogOpen} 
        onOpenChange={handleCloseDialog} 
        usuario={usuarioParaEditar}
      />

      <ServicoFormDialog
        open={isServicoFormOpen}
        onOpenChange={handleCloseServicoForm}
        servico={selectedServico}
      />

      <AlertDialog open={isServicoDeleteDialogOpen} onOpenChange={setIsServicoDeleteDialogOpen}>
        <AlertDialogContent className="border-border rounded-lg bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold uppercase tracking-wider">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o serviço <strong>{servicoToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs uppercase tracking-wider h-9">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteServico}
              className="text-xs uppercase tracking-wider h-9 bg-primary text-primary-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
