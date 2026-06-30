import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
import { MoreVertical, Pencil, Ban, UserCheck, UserX } from 'lucide-react'
import type { Agendamento } from '@/types/models'
import { isAfter, addMinutes } from 'date-fns'

import { STATUS_AGENDAMENTO_LABELS, STATUS_AGENDAMENTO_COLORS } from '@/lib/constants'
import { useState, useMemo } from 'react'

interface AgendamentosColumnsProps {
  agendamentos: Agendamento[]
  profissionais: any[]
  onEdit: (agendamento: Agendamento) => void
  onCancel: (agendamento: Agendamento) => void
  onChangeStatus: (agendamento: Agendamento, status: Agendamento['status']) => void
}

interface TimeSlot {
  hour: number
  minute: number
  label: string
}

export function AgendamentosColumns({
  agendamentos,
  profissionais,
  onEdit,
  onCancel,
  onChangeStatus,
}: AgendamentosColumnsProps) {
  const [showClienteChegouDialog, setShowClienteChegouDialog] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)

  // Gerar slots de 15 em 15 minutos das 8h às 20h
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString().padStart(2, '0')
        const minuteStr = minute.toString().padStart(2, '0')
        slots.push({
          hour,
          minute,
          label: `${hourStr}:${minuteStr}`,
        })
      }
    }
    return slots
  }, [])

  // Agrupar agendamentos por profissional
  const agendamentosPorProfissional = useMemo(() => {
    const grouped = new Map<string, Agendamento[]>()

    profissionais.forEach(prof => {
      grouped.set(prof.id, [])
    })

    agendamentos.forEach(ag => {
      const list = grouped.get(ag.profissional_id) || []
      list.push(ag)
      grouped.set(ag.profissional_id, list)
    })

    return grouped
  }, [agendamentos, profissionais])

  // Verificar se um agendamento está em determinado slot
  function getAgendamentoInSlot(profissionalId: string, slot: TimeSlot): Agendamento | null {
    const agendamentosList = agendamentosPorProfissional.get(profissionalId) || []

    return agendamentosList.find(ag => {
      const agDate = new Date(ag.data_hora)
      const agHour = agDate.getHours()
      const agMinute = agDate.getMinutes()

      return agHour === slot.hour && agMinute === slot.minute
    }) || null
  }

  const getStatusBadgeVariant = (_status: Agendamento['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    return 'default'
  }

  function shouldShowClienteChegouPrompt(agendamento: Agendamento): boolean {
    const now = new Date()
    const agendamentoHora = new Date(agendamento.data_hora)
    const toleranciaMinutos = 15
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

  if (profissionais.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Nenhum profissional cadastrado
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="grid gap-1" style={{ gridTemplateColumns: `100px repeat(${profissionais.length}, minmax(250px, 1fr))` }}>
            {/* Cabeçalho */}
            <div className="sticky left-0 bg-background border-r border-b p-3 font-semibold text-sm">
              Horário
            </div>
            {profissionais.map(prof => (
              <div key={prof.id} className="border-b border-r p-3 font-semibold text-sm bg-muted/50">
                {prof.nome}
              </div>
            ))}

            {/* Linhas de horário */}
            {timeSlots.map(slot => (
              <div key={slot.label} className="contents">
                {/* Coluna de horário */}
                <div className="sticky left-0 bg-background border-r border-b p-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {slot.label}
                </div>

                {/* Colunas de profissionais */}
                {profissionais.map(prof => {
                  const agendamento = getAgendamentoInSlot(prof.id, slot)

                  return (
                    <div
                      key={`${prof.id}-${slot.label}`}
                      className="border-b border-r p-1 min-h-[60px] bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      {agendamento && (
                        <Card className="h-full shadow-sm border-l-4" style={{ borderLeftColor: STATUS_AGENDAMENTO_COLORS[agendamento.status] }}>
                          <CardContent className="p-2 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {agendamento.cliente?.nome}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {agendamento.servico?.nome}
                                </p>
                                <p className="text-xs font-semibold text-primary">
                                  R$ {agendamento.valor.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Badge variant={getStatusBadgeVariant(agendamento.status)} className="text-xs px-1 py-0">
                                  {STATUS_AGENDAMENTO_LABELS[agendamento.status]}
                                </Badge>
                                {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {agendamento.status !== 'em_atendimento' && (
                                        <DropdownMenuItem onClick={() => onEdit(agendamento)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Editar
                                        </DropdownMenuItem>
                                      )}
                                      {!['concluido', 'cancelado', 'em_atendimento', 'pendente_caixa'].includes(agendamento.status) && (
                                        <>
                                          <DropdownMenuSeparator />
                                          {agendamento.status === 'em_atraso' && (
                                            <DropdownMenuItem onClick={() => handleClienteChegou(agendamento)} className="text-orange-600">
                                              <UserCheck className="h-4 w-4 mr-2" />
                                              Cliente chegou?
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            onClick={() => onCancel(agendamento)}
                                            className="text-red-600"
                                          >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Cancelar
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>

                            {shouldShowClienteChegouPrompt(agendamento) && (
                              <div className="pt-1 border-t mt-1 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClienteChegou(agendamento)}
                                  className="h-6 text-xs gap-1 flex-1"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClienteChegouNao(agendamento)}
                                  className="h-6 text-xs gap-1 flex-1 text-red-600"
                                >
                                  <UserX className="h-3 w-3" />
                                  Não
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </>
  )
}
