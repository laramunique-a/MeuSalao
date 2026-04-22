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
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!salao) {
    return (
      <div className="p-8">
        <div className="text-center py-16 bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/20">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Erro ao carregar dados do estabelecimento. Por favor, tente novamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Gerencie as informações do salão, equipe e identidade visual.
          </p>
        </div>
      </div>

      <Tabs defaultValue="salao" className="space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm transition-all duration-300 w-fit">
          <TabsList className="bg-transparent h-9 gap-1">
            <TabsTrigger 
              value="salao" 
              className="rounded-xl px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-full text-xs"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Dados do Salão
            </TabsTrigger>
            <TabsTrigger 
              value="usuarios" 
              className="rounded-xl px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-full text-xs"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários 
              <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-[10px] rounded-full font-black">{usuarios.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financeiro" 
              className="rounded-xl px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-full text-xs"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="salao" className="mt-0 outline-none animate-in slide-in-from-bottom-4 duration-500">
          <SalaoForm salao={salao} />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0 outline-none animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-xl shadow-primary/5 overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-muted/20 py-6 px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight">Equipe e Acesso</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">Gerencie quem pode acessar o sistema e seus níveis de permissão.</p>
                </div>
                <Button 
                  onClick={() => {
                    setUsuarioParaEditar(null)
                    setDialogOpen(true)
                  }}
                  className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2 stroke-[3px]" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsuarios ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                </div>
              ) : (
                <div className="px-4 py-6 md:px-8">
                  <UsuariosTable usuarios={usuarios} onEdit={handleEdit} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-0 outline-none animate-in slide-in-from-bottom-4 duration-500">
          <TaxasCartaoForm salao={salao} />
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
