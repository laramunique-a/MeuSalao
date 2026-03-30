import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServicos, useDeleteServico, useToggleServicoAtivo } from '@/hooks/useServicos'
import { ServicoFormDialog } from '@/components/servicos/ServicoFormDialog'
import { ServicosTable } from '@/components/servicos/ServicosTable'
import type { Servico } from '@/types/models'
import { useToast } from '@/hooks/use-toast'
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

export default function Servicos() {
  const { toast } = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [servicoToDelete, setServicoToDelete] = useState<Servico | null>(null)

  const { data: servicos = [], isLoading } = useServicos()
  const deleteServico = useDeleteServico()
  const toggleAtivo = useToggleServicoAtivo()

  function handleEdit(servico: Servico) {
    setSelectedServico(servico)
    setIsFormOpen(true)
  }

  function handleDelete(servico: Servico) {
    setServicoToDelete(servico)
    setIsDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!servicoToDelete) return

    try {
      await deleteServico.mutateAsync(servicoToDelete.id)
      toast({
        title: 'Serviço excluído!',
        description: 'O serviço foi removido com sucesso.',
      })
      setIsDeleteDialogOpen(false)
      setServicoToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir serviço',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function handleToggleAtivo(servico: Servico) {
    try {
      await toggleAtivo.mutateAsync({
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

  function handleCloseForm() {
    setIsFormOpen(false)
    setSelectedServico(null)
  }

  const servicosAtivos = servicos.filter((s) => s.ativo).length
  const servicosInativos = servicos.filter((s) => !s.ativo).length

  return (
    <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Serviços</h1>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 px-3 shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm transition-all duration-300">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
            Total: <span className="text-primary ml-1">{servicos.length}</span>
          </Badge>
          <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
            Ativos: <span className="text-green-600 ml-1">{servicosAtivos}</span>
          </Badge>
          <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
            Inativos: <span className="text-orange-600 ml-1">{servicosInativos}</span>
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando serviços...</div>
      ) : (
        <>

          <ServicosTable
            servicos={servicos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAtivo={handleToggleAtivo}
          />
        </>
      )}

      <ServicoFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        servico={selectedServico}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço <strong>{servicoToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
