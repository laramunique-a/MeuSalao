import { useState } from 'react'
import { useSalao } from '@/hooks/useSalao'
import { useUsuarios } from '@/hooks/useUsuarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalaoForm } from '@/components/configuracoes/SalaoForm'
import { UsuarioFormDialog } from '@/components/configuracoes/UsuarioFormDialog'
import { UsuariosTable } from '@/components/configuracoes/UsuariosTable'
import { Building2, Users, Plus, Loader2 } from 'lucide-react'

export default function Configuracoes() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: salao, isLoading: loadingSalao } = useSalao()
  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios()

  if (loadingSalao) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!salao) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Erro ao carregar dados do salão
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie as informações do salão e usuários
        </p>
      </div>

      <Tabs defaultValue="salao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="salao" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dados do Salão
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({usuarios.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salao">
          <SalaoForm salao={salao} />
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usuários do Sistema</CardTitle>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <UsuariosTable usuarios={usuarios} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UsuarioFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
