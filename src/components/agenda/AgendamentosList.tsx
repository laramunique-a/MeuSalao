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
import { User, Scissors, MoreVertical, Pencil, Ban, Check, Trash2, UserCheck, UserX } from 'lucide-react'
import type { Agendamento } from '@/types/models'
import { format, isAfter, addMinutes } from 'date-fns'
import { STATUS_AGENDAMENTO_LABELS } from '@/lib/constants'
import { useState, useMemo } from 'react'
import type { BloqueioAgenda } from '@/types/models'
import { cn } from '@/lib/utils'

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
  const [showClienteChegouDialog, setShowClienteChegouDialog] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)

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

  const getStatusBadgeStyles = (status: Agendamento['status']) => {
    switch (status) {
      case 'cancelado':
        return 'border-border text-red-500 bg-red-500/10 dark:bg-red-500/20'
      case 'em_atraso':
        return 'border-border text-amber-600 bg-amber-500/10 dark:bg-amber-500/20'
      case 'concluido':
        return 'border-border text-muted-foreground bg-accent'
      default:
        return 'border-border text-foreground bg-accent/50'
    }
  }

  function shouldShowClienteChegouPrompt(agendamento: Agendamento): boolean {
    const now = new Date()
    const agendamentoHora = new Date(agendamento.data_hora)

    const isToday =
      agendamentoHora.getDate() === now.getDate() &&
      agendamentoHora.getMonth() === now.getMonth() &&
      agendamentoHora.getFullYear() === now.getFullYear()

    if (!isToday) return false

    const toleranciaMinutos = 20
    const agendamentoComTolerancia = addMinutes(agendamentoHora, -toleranciaMinutos)

    return (
      ['agendado', 'em_atraso'].includes(agendamento.status) &&
      isAfter(now, agendamentoComTolerancia)
    )
  }

  function handleClienteChegou(agendamento: Agendamento) {
    setSelectedAgendamento(agendamento)
    setShowClienteChegouDialog(true)
  }

  function handleClienteChegouSim() {
    if (selectedAgendamento) {
      onChangeStatus(selectedAgendamento, 'em_atendimento')
    }
    setShowClienteChegouDialog(false)
    setSelectedAgendamento(null)
  }

  function handleClienteChegouNao(agendamento: Agendamento) {
    onChangeStatus(agendamento, 'em_atraso')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mergedItems.map((item) => {
        if (item.type === 'agendamento') {
          const { data: agendamento } = item
          return (
            <Card key={agendamento.id} className="relative flex flex-col h-full overflow-hidden border-border bg-card hover:bg-accent/10 transition-colors">
              <CardHeader className="py-4 px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0">
                    <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                      {item.time}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border shadow-none", getStatusBadgeStyles(agendamento.status))}>
                      {STATUS_AGENDAMENTO_LABELS[agendamento.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 border-border">
                        <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gerenciar Agendamento</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(agendamento)} className="py-2.5 text-xs font-semibold uppercase tracking-wider">
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClienteChegou(agendamento)} className="py-2.5 text-xs font-semibold uppercase tracking-wider">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Cliente chegou?
                        </DropdownMenuItem>
                        {agendamento.status === 'em_atendimento' && (
                          <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'pendente_caixa')} className="py-2.5 text-xs font-semibold uppercase tracking-wider">
                            <Check className="h-4 w-4 mr-2" />
                            Finalizar Atendimento
                          </DropdownMenuItem>
                        )}
                        {!['concluido', 'cancelado', 'em_atendimento', 'pendente_caixa'].includes(agendamento.status) && (
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
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground tracking-tight truncate">
                        {agendamento.cliente?.nome}
                      </span>
                      {agendamento.cliente?.telefone && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {agendamento.cliente.telefone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-0.5">
                    {filterProfissional === 'todos' && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-normal uppercase tracking-wider">Profissional:</span>
                        <span className="font-semibold text-foreground truncate">{agendamento.profissional?.nome}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Scissors className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span className="font-medium truncate">{agendamento.servico?.nome}</span>
                    </div>
                  </div>

                  {agendamento.observacoes && (
                    <div className="pt-2 border-t border-dashed mt-1">
                      <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                        <span className="font-bold mr-1.5 text-[9px] uppercase tracking-widest opacity-50">Obs:</span>
                        {agendamento.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Direita: Prompt de Chegada (Apenas se aplicável) */}
                {shouldShowClienteChegouPrompt(agendamento) && (
                  <div className="w-full sm:w-44 flex-shrink-0 bg-accent/40 border border-border rounded-lg p-3 flex flex-col items-center justify-center gap-2 self-stretch" style={{ height: 'fit-content' }}>
                    <span className="text-xs font-bold text-muted-foreground text-center uppercase tracking-wider leading-tight">
                      Cliente chegou?
                    </span>
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClienteChegou(agendamento)}
                        className="h-8 text-[10px] gap-1 flex-1 text-foreground border-border hover:bg-accent"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        Sim
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClienteChegouNao(agendamento)}
                        className="h-8 text-[10px] gap-1 flex-1 text-foreground border-border hover:bg-accent"
                      >
                        <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                        Não
                      </Button>
                    </div>
                  </div>
                )}
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

      <AlertDialog open={showClienteChegouDialog} onOpenChange={setShowClienteChegouDialog}>
        <AlertDialogContent className="border-border rounded-lg bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold uppercase tracking-wider">Confirmar chegada do cliente</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Deseja confirmar que o cliente{' '}
              <strong>{selectedAgendamento?.cliente?.nome}</strong> chegou para o
              atendimento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs uppercase tracking-wider h-9">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClienteChegouSim} className="text-xs uppercase tracking-wider h-9 bg-primary text-primary-foreground">
              Sim, cliente chegou
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
