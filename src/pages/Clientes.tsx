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
    <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 px-3 shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="relative w-full sm:w-72 lg:w-96 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-border group-focus-within:border-primary/50 transition-all rounded-xl shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>

          <div className="h-6 w-[1px] bg-border/40 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar scroll-smooth pb-1 sm:pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLetter(null)}
              className={cn(
                "h-8 px-4 text-[10px] uppercase font-bold transition-all shrink-0",
                selectedLetter === null 
                  ? "text-primary bg-primary/15 shadow-[0_2px_10px_-3px_rgba(var(--primary),0.3)] ring-1 ring-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
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
                    "h-8 w-8 text-[11px] p-0 font-extrabold transition-all shrink-0",
                    selectedLetter === letter 
                      ? "text-primary bg-primary/15 shadow-[0_2px_10px_-3px_rgba(var(--primary),0.3)] ring-1 ring-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
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
        <div className="text-center py-12">Carregando clientes...</div>
      ) : (
        <>
          <div className="mb-4">
            <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-muted/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
              <span className="text-primary mr-1">{displayedClientes.length}</span>
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
