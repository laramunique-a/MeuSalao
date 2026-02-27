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
import { Pencil, Trash2, Clock } from 'lucide-react'
import type { Servico } from '@/types/models'
import { Switch } from '@/components/ui/switch'

interface ServicosTableProps {
  servicos: Servico[]
  onEdit: (servico: Servico) => void
  onDelete: (servico: Servico) => void
  onToggleAtivo: (servico: Servico) => void
}

export function ServicosTable({ servicos, onEdit, onDelete, onToggleAtivo }: ServicosTableProps) {
  if (servicos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum serviço encontrado
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 h-10">Serviço</TableHead>
            <TableHead className="py-2 h-10">Descrição</TableHead>
            <TableHead className="py-2 h-10">Valor</TableHead>
            <TableHead className="py-2 h-10">Duração</TableHead>
            <TableHead className="py-2 h-10">Status</TableHead>
            <TableHead className="text-right py-2 h-10">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicos.map((servico) => (
            <TableRow key={servico.id} className="hover:bg-muted/30">
              <TableCell className="font-medium py-2">{servico.nome}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground py-2">
                {servico.descricao || '-'}
              </TableCell>
              <TableCell className="font-semibold py-2 text-xs">
                R$ {servico.valor.toFixed(2)}
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {servico.duracao_minutos} min
                </div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2 scale-90 origin-left">
                  <Switch
                    checked={servico.ativo}
                    onCheckedChange={() => onToggleAtivo(servico)}
                  />
                  <Badge variant={servico.ativo ? 'default' : 'secondary'} className="text-[10px] px-1.5 h-4">
                    {servico.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right py-1">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEdit(servico)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onDelete(servico)}
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
