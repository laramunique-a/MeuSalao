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
import { Building2, Users, Plus, Loader2, CreditCard } from 'lucide-react'

export default function Configuracoes() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<any>(null)
  const { data: salao, isLoading: loadingSalao } = useSalao()
  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios()

  const handleEdit = (usuario: any) => {
    setUsuarioParaEditar(usuario)
    setDialogOpen(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setUsuarioParaEditar(null)
  }

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
            Gerencie as informações do salão, equipe e configurações.
          </p>
        </div>
      </div>

      <Tabs defaultValue="salao" className="space-y-6">
        <div className="flex items-center gap-1 bg-card border border-border p-3 rounded-lg w-fit">
          <TabsList className="bg-transparent h-9 gap-1">
            <TabsTrigger 
              value="salao" 
              className="rounded-lg px-4 data-[state=active]:bg-accent data-[state=active]:text-foreground font-semibold transition-colors h-full text-xs uppercase tracking-wider"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Dados do Salão
            </TabsTrigger>
            <TabsTrigger 
              value="usuarios" 
              className="rounded-lg px-4 data-[state=active]:bg-accent data-[state=active]:text-foreground font-semibold transition-colors h-full text-xs uppercase tracking-wider"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários 
              <span className="ml-2 px-1.5 py-0.5 bg-accent text-[9px] rounded-full font-bold border border-border">{usuarios.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financeiro" 
              className="rounded-lg px-4 data-[state=active]:bg-accent data-[state=active]:text-foreground font-semibold transition-colors h-full text-xs uppercase tracking-wider"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="salao" className="mt-0 outline-none">
          <div className="max-w-[720px] mx-auto">
            <SalaoForm salao={salao} />
          </div>
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
    </div>
  )
}
