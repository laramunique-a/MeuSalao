import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { MoreVertical, Pencil, Ban, UserCheck, UserX, Plus, Clock } from 'lucide-react'
import type { Agendamento } from '@/types/models'
import { isAfter, addMinutes, setHours, setMinutes } from 'date-fns'
import { useState, useMemo } from 'react'

interface AgendamentosColumnsProps {
  agendamentos: Agendamento[]
  profissionais: any[]
  selectedDate: Date
  onEdit: (agendamento: Agendamento) => void
  onCancel: (agendamento: Agendamento) => void
  onChangeStatus: (agendamento: Agendamento, status: Agendamento['status']) => void
  onSlotClick?: (profissionalId: string, date: Date) => void
}

interface TimeSlot {
  hour: number
  minute: number
  label: string
  isFullHour: boolean
}

export function getStatusTheme(status: Agendamento['status']) {
  switch (status) {
    case 'concluido':
      return {
        cardBg: 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 shadow-sm',
        badgeBg: 'bg-emerald-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm',
        label: 'Concluído',
      }
    case 'em_atendimento':
      return {
        cardBg: 'bg-blue-100/90 dark:bg-blue-950/70 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30 text-blue-950 dark:text-blue-100 shadow-md',
        badgeBg: 'bg-blue-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1',
        label: 'Em Atendimento',
      }
    case 'pendente_caixa':
      return {
        cardBg: 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 shadow-sm',
        badgeBg: 'bg-amber-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm',
        label: 'Pendente Caixa',
      }
    case 'agendado':
      return {
        cardBg: 'bg-sky-100/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-950 dark:text-sky-100 shadow-sm',
        badgeBg: 'bg-sky-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm',
        label: 'Agendado',
      }
    case 'em_atraso':
      return {
        cardBg: 'bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100 shadow-sm',
        badgeBg: 'bg-rose-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm',
        label: 'Em Atraso',
      }
    case 'cancelado':
      return {
        cardBg: 'bg-gray-200/60 dark:bg-gray-900/60 border-gray-300 dark:border-gray-800 opacity-60 text-muted-foreground line-through',
        badgeBg: 'bg-gray-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full',
        label: 'Cancelado',
      }
    default:
      return {
        cardBg: 'bg-card border-border text-foreground',
        badgeBg: 'bg-primary text-primary-foreground text-[9px]',
        label: status,
      }
  }
}

export function AgendamentosColumns({
  agendamentos,
  profissionais,
  selectedDate,
  onEdit,
  onCancel,
  onChangeStatus,
  onSlotClick,
}: AgendamentosColumnsProps) {
  const [showClienteChegouDialog, setShowClienteChegouDialog] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)

  // Gerar slots de 30 em 30 minutos das 8h às 20h (estilo agenda de papel)
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) break
        const hourStr = hour.toString().padStart(2, '0')
        const minuteStr = minute.toString().padStart(2, '0')
        slots.push({
          hour,
          minute,
          label: `${hourStr}:${minuteStr}`,
          isFullHour: minute === 0,
        })
      }
    }
    return slots
  }, [])

  // Agrupar agendamentos por profissional
  const agendamentosPorProfissional = useMemo(() => {
    const grouped = new Map<string, Agendamento[]>()

    profissionais.forEach((prof) => {
      grouped.set(prof.id, [])
    })

    agendamentos.forEach((ag) => {
      const list = grouped.get(ag.profissional_id) || []
      list.push(ag)
      grouped.set(ag.profissional_id, list)
    })

    return grouped
  }, [agendamentos, profissionais])

  function getAgendamentoInSlot(profissionalId: string, slot: TimeSlot): Agendamento | null {
    const agendamentosList = agendamentosPorProfissional.get(profissionalId) || []

    return (
      agendamentosList.find((ag) => {
        const agDate = new Date(ag.data_hora)
        const agHour = agDate.getHours()
        const agMinute = agDate.getMinutes()

        // Encaixa se for a hora de início aproximada no slot de 30 min
        return agHour === slot.hour && Math.abs(agMinute - slot.minute) < 15
      }) || null
    )
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

  function handleCellClick(profissionalId: string, slot: TimeSlot) {
    if (!onSlotClick) return
    const slotDate = setMinutes(setHours(new Date(selectedDate), slot.hour), slot.minute)
    onSlotClick(profissionalId, slotDate)
  }

  if (profissionais.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-wider">
        Nenhum profissional cadastrado para o salão.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <div className="inline-block min-w-full align-middle">
          {/* Grade de Agenda de Papel */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `90px repeat(${profissionais.length}, minmax(240px, 1fr))`,
            }}
          >
            {/* Cabeçalho da Régua de Horário */}
            <div className="sticky left-0 z-20 bg-muted/90 backdrop-blur-md border-r border-b border-border p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Horário
            </div>

            {/* Cabeçalhos dos Profissionais */}
            {profissionais.map((prof) => {
              const profAgendamentos = agendamentosPorProfissional.get(prof.id) || []
              const totalAtivos = profAgendamentos.filter((a) => a.status !== 'cancelado').length

              return (
                <div
                  key={prof.id}
                  className="border-b border-r border-border p-3 bg-muted/40 backdrop-blur-sm flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {prof.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground uppercase tracking-wider truncate">
                        {prof.nome}
                      </p>
                      <p className="text-[9px] text-muted-foreground capitalize truncate">
                        {prof.perfil || 'Profissional'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
                    <span className="bg-background px-2 py-0.5 rounded border border-border">
                      {totalAtivos} {totalAtivos === 1 ? 'atendimento' : 'atendimentos'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Linhas da Grade de Papel (30 em 30 min) */}
            {timeSlots.map((slot) => (
              <div key={slot.label} className="contents">
                {/* Marcador de Horário na Régua Lateral */}
                <div
                  className={`sticky left-0 z-10 bg-background/95 backdrop-blur-sm border-r border-border px-3 py-2 text-[11px] font-mono font-bold text-muted-foreground flex items-center ${
                    slot.isFullHour ? 'border-b border-border bg-accent/10 text-foreground' : 'border-b border-dashed border-border/40 text-muted-foreground/70'
                  }`}
                >
                  {slot.label}
                </div>

                {/* Células de cada profissional na linha do horário */}
                {profissionais.map((prof) => {
                  const agendamento = getAgendamentoInSlot(prof.id, slot)

                  if (agendamento) {
                    const theme = getStatusTheme(agendamento.status)

                    return (
                      <div
                        key={`${prof.id}-${slot.label}`}
                        className={`p-1.5 min-h-[75px] border-r transition-all ${
                          slot.isFullHour ? 'border-b border-border' : 'border-b border-dashed border-border/40'
                        }`}
                      >
                        <Card className={`h-full border-2 rounded-xl transition-all ${theme.cardBg}`}>
                          <CardContent className="p-2.5 space-y-1.5">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <span className={theme.badgeBg}>
                                  {theme.label}
                                </span>
                                <p className="font-black text-xs uppercase tracking-wider truncate mt-1.5">
                                  {agendamento.cliente?.nome}
                                </p>
                                <p className="text-[10px] font-medium opacity-80 truncate">
                                  {agendamento.servico?.nome}
                                </p>
                              </div>

                              {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {agendamento.status !== 'em_atendimento' && (
                                      <DropdownMenuItem onClick={() => onEdit(agendamento)}>
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                    )}
                                    {agendamento.status === 'em_atraso' && (
                                      <DropdownMenuItem onClick={() => handleClienteChegou(agendamento)} className="text-amber-600">
                                        <UserCheck className="h-3.5 w-3.5 mr-2" />
                                        Cliente chegou?
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => onCancel(agendamento)} className="text-red-600">
                                      <Ban className="h-3.5 w-3.5 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] opacity-90 pt-1 font-bold">
                              <span>R$ {agendamento.valor.toFixed(2).replace('.', ',')}</span>
                              <span>{agendamento.servico?.duracao_minutos || 60} min</span>
                            </div>

                            {shouldShowClienteChegouPrompt(agendamento) && (
                              <div className="pt-1.5 border-t border-black/10 dark:border-white/10 mt-1 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClienteChegou(agendamento)}
                                  className="h-6 text-[10px] font-bold gap-1 flex-1 bg-white/80 dark:bg-black/40"
                                >
                                  <UserCheck className="h-3 w-3 text-emerald-600" />
                                  Chegou
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClienteChegouNao(agendamento)}
                                  className="h-6 text-[10px] font-bold gap-1 flex-1 text-red-600 bg-white/80 dark:bg-black/40"
                                >
                                  <UserX className="h-3 w-3" />
                                  Atrasou
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )
                  }

                  // Linha/Célula vazia estilo Agenda de Papel
                  return (
                    <div
                      key={`${prof.id}-${slot.label}`}
                      onClick={() => handleCellClick(prof.id, slot)}
                      className={`p-1 min-h-[55px] border-r transition-all group cursor-pointer relative ${
                        slot.isFullHour
                          ? 'border-b border-border bg-background hover:bg-emerald-500/5'
                          : 'border-b border-dashed border-border/40 bg-background/50 hover:bg-emerald-500/5'
                      }`}
                      title={`Clique para agendar às ${slot.label} com ${prof.nome}`}
                    >
                      <div className="h-full w-full rounded-lg border border-transparent group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/40 group-hover:text-emerald-600 font-bold transition-all">
                        <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                          Agendar às {slot.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de confirmação se o cliente chegou */}
      <AlertDialog open={showClienteChegouDialog} onOpenChange={setShowClienteChegouDialog}>
        <AlertDialogContent className="rounded-xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-wider">Confirmar chegada do cliente</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Deseja confirmar que o cliente{' '}
              <strong className="text-foreground">{selectedAgendamento?.cliente?.nome}</strong> chegou para o atendimento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs uppercase">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClienteChegouSim} className="text-xs uppercase bg-primary text-primary-foreground">
              Sim, cliente chegou
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
