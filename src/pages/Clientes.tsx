import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClientes, useDeleteCliente, useSearchClientes } from '@/hooks/useClientes'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { DeleteClienteDialog } from '@/components/clientes/DeleteClienteDialog'
import { ClientesTable } from '@/components/clientes/ClientesTable'
import type { Cliente } from '@/types/models'
import { useToast } from '@/hooks/use-toast'

export default function Clientes() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const { data: clientes = [], isLoading } = useClientes()
  const { data: searchResults = [] } = useSearchClientes(searchTerm)
  const deleteCliente = useDeleteCliente()

  const baseFiltered = searchTerm.length > 0 ? searchResults : clientes
  const displayedClientes = selectedLetter
    ? baseFiltered.filter((c) => c.nome.trim().toUpperCase().startsWith(selectedLetter))
    : baseFiltered

  function handleEdit(cliente: Cliente) {
    setSelectedCliente(cliente)
    setIsFormOpen(true)
  }

  function handleDelete(cliente: Cliente) {
    setClienteToDelete(cliente)
    setIsDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!clienteToDelete) return

    try {
      await deleteCliente.mutateAsync(clienteToDelete.id)
      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      })
      setIsDeleteDialogOpen(false)
      setClienteToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir cliente',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  function handleCloseForm() {
    setIsFormOpen(false)
    setSelectedCliente(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os clientes do seu salão
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-0.5">
          <Button
            variant={selectedLetter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLetter(null)}
            className="h-7 px-2 text-[9px] uppercase font-bold"
          >
            Todos
          </Button>
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLetter(letter)}
              className="h-7 w-7 text-[9px] p-0 font-bold"
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando clientes...</div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {displayedClientes.length} {displayedClientes.length === 1 ? 'cliente' : 'clientes'}
            {searchTerm && ' encontrado(s)'}
          </div>
          <ClientesTable
            clientes={displayedClientes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      <ClienteFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        cliente={selectedCliente}
      />

      <DeleteClienteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        clienteNome={clienteToDelete?.nome || ''}
      />
    </div>
  )
}
