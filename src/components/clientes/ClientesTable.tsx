import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Phone, Mail } from 'lucide-react'
import type { Cliente } from '@/types/models'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientesTableProps {
  clientes: Cliente[]
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
}

export function ClientesTable({ clientes, onEdit, onDelete }: ClientesTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum cliente encontrado
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 h-10">Nome</TableHead>
            <TableHead className="py-2 h-10">Contato</TableHead>
            <TableHead className="py-2 h-10">Observações</TableHead>
            <TableHead className="py-2 h-10">Cadastrado em</TableHead>
            <TableHead className="text-right py-2 h-10">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id} className="hover:bg-muted/30">
              <TableCell className="font-medium py-2">{cliente.nome}</TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-3">
                  {cliente.telefone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      <Phone className="h-3 w-3" />
                      {cliente.telefone}
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={cliente.email}>
                      <Mail className="h-3 w-3" />
                      {cliente.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground py-2">
                {cliente.observacoes || '-'}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground py-2">
                {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right py-1">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEdit(cliente)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onDelete(cliente)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
