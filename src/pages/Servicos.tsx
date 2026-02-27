import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServicos, useDeleteServico, useToggleServicoAtivo } from '@/hooks/useServicos'
import { ServicoFormDialog } from '@/components/servicos/ServicoFormDialog'
import { ServicosTable } from '@/components/servicos/ServicosTable'
import type { Servico } from '@/types/models'
import { useToast } from '@/hooks/use-toast'
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os serviços oferecidos no seu salão
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando serviços...</div>
      ) : (
        <>
          <div className="mb-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Total: <span className="font-semibold">{servicos.length}</span>
            </div>
            <div>
              Ativos: <span className="font-semibold text-green-600">{servicosAtivos}</span>
            </div>
            <div>
              Inativos: <span className="font-semibold text-gray-500">{servicosInativos}</span>
            </div>
          </div>
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
