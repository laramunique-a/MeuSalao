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
        title: 'Service excluído!',
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
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Serviços</h1>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 px-3">
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 bg-card p-3 rounded-lg border border-border">
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
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs uppercase tracking-wider text-muted-foreground">Carregando serviços...</div>
      ) : (
        <ServicosTable
          servicos={servicos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleAtivo={handleToggleAtivo}
        />
      )}

      <ServicoFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        servico={selectedServico}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              onClick={confirmDelete}
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
