import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Scissors, MoreVertical, Pencil, Ban, Check, Trash2, UserCheck, Clock } from 'lucide-react'
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'
import { useMemo } from 'react'
import type { BloqueioAgenda } from '@/types/models'
import { cn } from '@/lib/utils'
import { getStatusTheme } from './AgendamentosColumns'

interface AgendamentosListProps {
  agendamentos: Agendamento[]
  bloqueios?: BloqueioAgenda[]
  filterProfissional?: string
  onEdit: (agendamento: Agendamento) => void
  onCancel: (agendamento: Agendamento) => void
  onChangeStatus: (agendamento: Agendamento, status: Agendamento['status']) => void
  onDeleteBlock: (id: string) => void
}

export function AgendamentosList({
  agendamentos,
  bloqueios = [],
  filterProfissional = 'todos',
  onEdit,
  onCancel,
  onChangeStatus,
  onDeleteBlock,
}: AgendamentosListProps) {
  const mergedItems = useMemo(() => {
    const items: (
      | { type: 'agendamento'; data: Agendamento; time: string }
      | { type: 'bloqueio'; data: BloqueioAgenda; time: string }
    )[] = [
        ...agendamentos.map((a) => ({
          type: 'agendamento' as const,
          data: a,
          time: format(new Date(a.data_hora), 'HH:mm'),
        })),
        ...bloqueios.map((b) => ({
          type: 'bloqueio' as const,
          data: b,
          time: b.horario_inicio.slice(0, 5),
        })),
      ]

    return items.sort((a, b) => a.time.localeCompare(b.time))
  }, [agendamentos, bloqueios])

  if (mergedItems.length === 0) {
    return (
      <div className="text-center py-12 text-xs uppercase tracking-wider text-muted-foreground">
        Nenhum compromisso ou bloqueio encontrado
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mergedItems.map((item) => {
        if (item.type === 'agendamento') {
          const { data: agendamento } = item
          const theme = getStatusTheme(agendamento.status)
          return (
            <Card key={agendamento.id} className={cn("relative flex flex-col h-full overflow-hidden border-2 transition-all shadow-sm", theme.cardBg)}>
              <CardHeader className="py-4 px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0">
                    <CardTitle className="text-lg font-black tracking-tight uppercase">
                      {item.time}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={theme.badgeBg}>
                      {theme.label}
                    </span>
                    {(agendamento as any).metadata?.retroativo && (
                      <Badge className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border shadow-none bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Retroativo
                      </Badge>
                    )}
                    {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-border">
                          <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gerenciar Agendamento</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {agendamento.status !== 'em_atendimento' && (
                            <DropdownMenuItem onClick={() => onEdit(agendamento)} className="py-2.5 text-xs font-semibold uppercase tracking-wider">
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar Detalhes
                            </DropdownMenuItem>
                          )}
                          {['agendado', 'em_atraso'].includes(agendamento.status) && (
                            <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'em_atendimento')} className="py-2.5 text-xs font-semibold uppercase tracking-wider text-blue-600 font-bold">
                              <UserCheck className="h-4 w-4 mr-2" />
                              Iniciar Atendimento
                            </DropdownMenuItem>
                          )}
                          {agendamento.status === 'em_atendimento' && (
                            <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'pendente_caixa')} className="py-2.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 font-bold">
                              <Check className="h-4 w-4 mr-2" />
                              Finalizar Atendimento
                            </DropdownMenuItem>
                          )}
                          {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCancel(agendamento)}
                                className="text-red-500 focus:text-red-500 py-2.5 text-xs font-semibold uppercase tracking-wider"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancelar Horário
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-1 flex flex-col sm:flex-row flex-1 gap-4">
                {/* Esquerda: Informações Principais */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-accent rounded-full">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-sm uppercase tracking-wider text-foreground truncate">
                        {agendamento.cliente?.nome}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-accent rounded-full">
                      <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs uppercase tracking-wide text-foreground/80 truncate">
                        {agendamento.servico?.nome}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        } else {
          const { data: bloqueio } = item
          return (
            <Card key={bloqueio.id} className="relative flex flex-col h-full overflow-hidden border-dashed border border-border bg-accent/10 opacity-75">
              <CardHeader className="py-4 px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0">
                    <CardTitle className="text-lg font-medium tracking-tight text-muted-foreground flex items-center gap-2">
                      <span>{item.time}</span>
                      <span className="text-xs font-normal opacity-50 uppercase tracking-wider">até</span>
                      <span>{bloqueio.horario_fim.slice(0, 5)}</span>
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="px-2 py-0.5 text-[9px] font-semibold border-border text-muted-foreground bg-accent/50 uppercase tracking-widest">
                    Bloqueio
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteBlock(bloqueio.id)}
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-1">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-1 bg-accent rounded-full">
                    <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      {bloqueio.motivo || 'Sem motivo especificado'}
                    </span>
                    {filterProfissional === 'todos' && (
                      <span className="text-[10px] font-medium opacity-70 uppercase tracking-wider mt-0.5">
                        Profissional: {bloqueio.profissional?.nome}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }
      })}
    </div>
  )
}
