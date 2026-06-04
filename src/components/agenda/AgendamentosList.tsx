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
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum compromisso ou bloqueio encontrado
      </div>
    )
  }

  const getStatusBadgeVariant = (status: Agendamento['status']) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      agendado: 'default',
      confirmado: 'default',
      em_atendimento: 'default',
      em_atraso: 'destructive',
      pendente_caixa: 'secondary',
      concluido: 'secondary',
      cancelado: 'destructive',
    }
    return colorMap[status] || 'default'
  }

  // Verificar se chegou o horário do agendamento
  function shouldShowClienteChegouPrompt(agendamento: Agendamento): boolean {
    const now = new Date()
    const agendamentoHora = new Date(agendamento.data_hora)

    // Só mostrar para agendamentos de hoje
    const isToday =
      agendamentoHora.getDate() === now.getDate() &&
      agendamentoHora.getMonth() === now.getMonth() &&
      agendamentoHora.getFullYear() === now.getFullYear()

    if (!isToday) return false

    const toleranciaMinutos = 20 // Tolerância de 20 minutos antes do horário
    const agendamentoComTolerancia = addMinutes(agendamentoHora, -toleranciaMinutos)

    // Mostrar prompt apenas se:
    // 1. Status é 'agendado' ou 'em_atraso'
    // 2. Horário atual >= horário do agendamento - tolerância
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
            <Card key={agendamento.id} className="relative flex flex-col h-full overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm">
              <CardHeader className="py-4 px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0">
                    <CardTitle className="text-2xl font-black tracking-tight text-zinc-700 dark:text-zinc-200">
                      {item.time}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(agendamento.status)} className="px-2.5 py-0.5 text-[11px] font-bold border-none shadow-none">
                      {STATUS_AGENDAMENTO_LABELS[agendamento.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50">
                          <MoreVertical className="h-5 w-5 text-muted-foreground/60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Gerenciar Agendamento</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(agendamento)} className="py-2.5">
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClienteChegou(agendamento)} className="py-2.5">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Cliente chegou?
                        </DropdownMenuItem>
                        {agendamento.status === 'em_atendimento' && (
                          <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'pendente_caixa')} className="py-2.5">
                            <Check className="h-4 w-4 mr-2" />
                            Finalizar Atendimento
                          </DropdownMenuItem>
                        )}
                        {!['concluido', 'cancelado', 'em_atendimento', 'pendente_caixa'].includes(agendamento.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onCancel(agendamento)}
                              className="text-red-500 focus:text-red-500 py-2.5"
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
                    <div className="p-1.5 bg-primary/5 rounded-full">
                      <User className="h-4 w-4 text-primary/60" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-base text-foreground tracking-tight truncate">
                        {agendamento.cliente?.nome}
                      </span>
                      {agendamento.cliente?.telefone && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {agendamento.cliente.telefone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-0.5">
                    {filterProfissional === 'todos' && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                        <span className="font-normal">Profissional:</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-200 truncate">{agendamento.profissional?.nome}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Scissors className="h-4 w-4 text-muted-foreground/40" />
                      <span className="font-medium truncate">{agendamento.servico?.nome}</span>
                    </div>
                  </div>

                  {agendamento.observacoes && (
                    <div className="pt-2 border-t border-dashed mt-1">
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        <span className="font-bold mr-1.5 text-[10px] uppercase tracking-widest opacity-50">Obs:</span>
                        {agendamento.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Direita: Prompt de Chegada (Apenas se aplicável) */}
                {shouldShowClienteChegouPrompt(agendamento) && (
                  <div className="w-full sm:w-44 flex-shrink-0 bg-primary/[0.03] dark:bg-primary/[0.05] border border-primary/10 rounded-xl p-3 flex flex-col items-center justify-center gap-2.5 self-stretch" style={{ height: 'fit-content' }}>
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 text-center leading-tight">
                      Cliente chegou?
                    </span>
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClienteChegou(agendamento)}
                        className="h-8 text-xs gap-1 flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-200 dark:border-green-900/30"
                      >
                        <UserCheck className="h-3 w-3" />
                        Sim
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClienteChegouNao(agendamento)}
                        className="h-8 text-xs gap-1 flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30"
                      >
                        <UserX className="h-3 w-3" />
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
            <Card key={bloqueio.id} className="relative flex flex-col h-full overflow-hidden border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-80 shadow-none">
              <CardHeader className="py-4 px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0">
                    <CardTitle className="text-2xl font-black tracking-tight text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                      <span>{item.time}</span>
                      <span className="text-sm font-normal opacity-50">até</span>
                      <span>{bloqueio.horario_fim.slice(0, 5)}</span>
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-bold border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Agenda Bloqueada
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => onDeleteBlock(bloqueio.id)}
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-1">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <Ban className="h-4 w-4 opacity-70" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase tracking-wider">
                      {bloqueio.motivo || 'Sem motivo especificado'}
                    </span>
                    {filterProfissional === 'todos' && (
                      <span className="text-[11px] font-medium opacity-70">
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

      {/* Dialog de confirmação */}
      <AlertDialog open={showClienteChegouDialog} onOpenChange={setShowClienteChegouDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar chegada do cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar que o cliente{' '}
              <strong>{selectedAgendamento?.cliente?.nome}</strong> chegou para o
              atendimento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClienteChegouSim}>
              Sim, cliente chegou
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
