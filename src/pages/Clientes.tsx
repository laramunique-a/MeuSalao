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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Clientes</h1>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 px-3">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 bg-card p-3 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="relative w-full sm:w-72 lg:w-96 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background border-border rounded-lg text-xs"
            />
          </div>

          <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-1 w-full overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLetter(null)}
              className={cn(
                "h-8 px-3 text-[10px] uppercase font-semibold transition-colors shrink-0",
                selectedLetter === null 
                  ? "text-foreground bg-accent" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              Todos
            </Button>
            
            <div className="flex items-center gap-0.5">
              {alphabet.map((letter) => (
                <Button
                  key={letter}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLetter(letter)}
                  className={cn(
                    "h-8 w-8 text-[10px] p-0 font-semibold transition-colors shrink-0",
                    selectedLetter === letter 
                      ? "text-foreground bg-accent" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs uppercase tracking-wider text-muted-foreground">Carregando clientes...</div>
      ) : (
        <>
          <div className="mb-4">
            <Badge variant="secondary" className="h-7 px-3 text-[10px] font-medium border border-border text-muted-foreground bg-background rounded-full">
              <span className="font-semibold text-foreground mr-1">{displayedClientes.length}</span>
              {displayedClientes.length === 1 ? 'cliente' : 'clientes'}
              {searchTerm && ' encontrado(s)'}
            </Badge>
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
