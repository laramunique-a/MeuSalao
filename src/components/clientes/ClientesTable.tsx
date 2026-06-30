import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Phone, Mail, AlertCircle } from 'lucide-react'
import type { Cliente } from '@/types/models'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePendenciasGlobais } from '@/hooks/useAgendamentos'

function formatarTelefoneBR(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')

  let cleanedDigits = digits
  if (cleanedDigits.startsWith('55') && cleanedDigits.length > 10) {
    cleanedDigits = cleanedDigits.substring(2)
  }

  if (cleanedDigits.length < 10) {
    return raw
  }

  if (cleanedDigits.length === 11) {
    const ddd = cleanedDigits.substring(0, 2)
    const parte1 = cleanedDigits.substring(2, 7)
    const parte2 = cleanedDigits.substring(7)
    return `(${ddd}) ${parte1}-${parte2}`
  }

  if (cleanedDigits.length === 10) {
    const ddd = cleanedDigits.substring(0, 2)
    const parte1 = cleanedDigits.substring(2, 6)
    const parte2 = cleanedDigits.substring(6)
    return `(${ddd}) ${parte1}-${parte2}`
  }

  if (cleanedDigits.length > 11) {
    const ddd = cleanedDigits.substring(cleanedDigits.length - 11, cleanedDigits.length - 9)
    const parte1 = cleanedDigits.substring(cleanedDigits.length - 9, cleanedDigits.length - 4)
    const parte2 = cleanedDigits.substring(cleanedDigits.length - 4)
    return `(${ddd}) ${parte1}-${parte2}`
  }

  return raw
}

interface ClientesTableProps {
  clientes: Cliente[]
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
}

export function ClientesTable({ clientes, onEdit, onDelete }: ClientesTableProps) {
  const { data: pendenciasGlobais = [] } = usePendenciasGlobais()

  if (clientes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum cliente encontrado
      </div>
    )
  }

  return (
    <>
      {/* Tabela Desktop */}
      <div className="hidden md:block rounded-md border">
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
            {clientes.map((cliente) => {
              const hasPendency = pendenciasGlobais.some((p) => p.cliente_id === cliente.id)

              return (
                <TableRow key={cliente.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{cliente.nome}</span>
                      {hasPendency && (
                        <Badge
                          variant="outline"
                          className="text-red-500 border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-[8px] font-bold h-5 rounded-full px-2 uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-none"
                        >
                          <AlertCircle className="h-2.5 w-2.5" />
                          Débito
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-3">
                      {cliente.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <Phone className="h-3 w-3" />
                          {formatarTelefoneBR(cliente.telefone)}
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
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* List Cards Mobile */}
      <div className="md:hidden space-y-3">
        {clientes.map((cliente) => {
          const hasPendency = pendenciasGlobais.some((p) => p.cliente_id === cliente.id)

          return (
            <div 
              key={cliente.id} 
              className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-bold text-sm text-foreground truncate max-w-[180px]">
                    {cliente.nome}
                  </span>
                  {hasPendency && (
                    <Badge
                      variant="outline"
                      className="text-red-500 border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-[8px] font-bold h-5 rounded-full px-2 uppercase tracking-wider flex items-center gap-1 w-fit shadow-none mt-1"
                    >
                      <AlertCircle className="h-2.5 w-2.5" />
                      Débito
                    </Badge>
                  )}
                </div>
                
                {/* Ações com botões de tamanho adequado para toque (48px) */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12"
                    onClick={() => onEdit(cliente)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onDelete(cliente)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Informações de contato e metadados */}
              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-dashed border-border pt-3">
                {cliente.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{formatarTelefoneBR(cliente.telefone)}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{cliente.email}</span>
                  </div>
                )}
                {cliente.observacoes && (
                  <div className="mt-2 bg-accent/30 p-2 rounded-lg text-[11px] leading-relaxed">
                    <span className="font-bold text-[9px] uppercase tracking-wider opacity-60 mr-1.5">OBS:</span>
                    {cliente.observacoes}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground/50 text-right pt-1">
                  Cadastrado em {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
