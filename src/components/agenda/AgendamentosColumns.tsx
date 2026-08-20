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
import { MoreVertical, Pencil, Ban, UserCheck, Plus, Clock, Sparkles, Check, Trash2 } from 'lucide-react'
import type { Agendamento, BloqueioAgenda } from '@/types/models'
import { setHours, setMinutes, isSameDay } from 'date-fns'
import { useState, useMemo, useEffect, useRef } from 'react'

interface AgendamentosColumnsProps {
  agendamentos: Agendamento[]
  bloqueios?: BloqueioAgenda[]
  profissionais: any[]
  selectedDate: Date
  onEdit: (agendamento: Agendamento) => void
  onCancel: (agendamento: Agendamento) => void
  onChangeStatus: (agendamento: Agendamento, status: Agendamento['status']) => void
  onSlotClick?: (profissionalId: string, date: Date) => void
  onDeleteBlock?: (id: string) => void
}

interface TimeSlot {
  hour: number
  minute: number
  label: string
  isFullHour: boolean
  isCustom?: boolean
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
  bloqueios = [],
  profissionais,
  selectedDate,
  onEdit,
  onCancel,
  onChangeStatus,
  onSlotClick,
  onDeleteBlock,
}: AgendamentosColumnsProps) {
  // Estado para armazenar o horário atual do sistema
  const [now, setNow] = useState(new Date())

  // Refs para controle de rolagem automática
  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const isToday = isSameDay(selectedDate, now)

  // Gerar slots de 30 em 30 minutos + incluir linhas dinâmicas de horários específicos de agendamentos e bloqueios
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slotMap = new Map<string, TimeSlot>()

    // 1. Criar os slots padrão de 30 em 30 min (00:00 às 23:30)
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0')
        const minuteStr = minute.toString().padStart(2, '0')
        const label = `${hourStr}:${minuteStr}`
        slotMap.set(label, {
          hour,
          minute,
          label,
          isFullHour: minute === 0,
          isCustom: false,
        })
      }
    }

    // 2. Adicionar linhas de horários específicos para agendamentos em minutos quebrados (ex: 20:25, 20:40)
    agendamentos.forEach((ag) => {
      const d = new Date(ag.data_hora)
      const hour = d.getHours()
      const minute = d.getMinutes()
      const hourStr = hour.toString().padStart(2, '0')
      const minuteStr = minute.toString().padStart(2, '0')
      const label = `${hourStr}:${minuteStr}`

      if (!slotMap.has(label)) {
        slotMap.set(label, {
          hour,
          minute,
          label,
          isFullHour: false,
          isCustom: true,
        })
      }
    })

    // 3. Adicionar linhas de horários específicos de início de bloqueios
    bloqueios.forEach((bq) => {
      const label = bq.horario_inicio.slice(0, 5)
      const [hour, minute] = label.split(':').map(Number)

      if (!slotMap.has(label)) {
        slotMap.set(label, {
          hour: isNaN(hour) ? 0 : hour,
          minute: isNaN(minute) ? 0 : minute,
          label,
          isFullHour: minute === 0,
          isCustom: true,
        })
      }
    })

    // 4. Ordenar todos os slots cronologicamente (00:00 -> 23:59)
    return Array.from(slotMap.values()).sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour
      return a.minute - b.minute
    })
  }, [agendamentos, bloqueios])

  // Identificar a label do slot atual (ex: "14:30")
  const currentSlotLabel = useMemo(() => {
    if (!isToday) return null
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()
    const roundedMin = currentMin < 30 ? '00' : '30'
    const hourStr = currentHour.toString().padStart(2, '0')
    return `${hourStr}:${roundedMin}`
  }, [isToday, now])

  // Função para rolar automaticamente posicionando o horário no terço superior (meio da tela)
  const scrollToCurrentTime = (smooth = true) => {
    if (!currentSlotLabel || !containerRef.current) return
    const targetEl = slotRefs.current.get(currentSlotLabel)
    if (targetEl) {
      const container = containerRef.current
      const targetTop = targetEl.offsetTop
      const scrollToY = targetTop - 120

      container.scrollTo({
        top: Math.max(0, scrollToY),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }

  // Auto-scroll inicial e contínuo a cada 30 segundos
  useEffect(() => {
    if (!isToday) return

    const timeout = setTimeout(() => {
      scrollToCurrentTime(true)
    }, 150)

    const timer = setInterval(() => {
      setNow(new Date())
      scrollToCurrentTime(true)
    }, 30000)

    return () => {
      clearTimeout(timeout)
      clearInterval(timer)
    }
  }, [selectedDate, isToday, currentSlotLabel])

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

  // Converte hora e minuto para total de minutos desde meia-noite
  function toTotalMinutes(hour: number, minute: number): number {
    return hour * 60 + minute
  }

  // Buscar TODOS os agendamentos pertencentes ao slot de horário
  function getAgendamentosInSlot(profissionalId: string, slot: TimeSlot): Agendamento[] {
    const agendamentosList = agendamentosPorProfissional.get(profissionalId) || []

    return agendamentosList.filter((ag) => {
      const agDate = new Date(ag.data_hora)
      const agHour = agDate.getHours()
      const agMinute = agDate.getMinutes()

      if (slot.isCustom) {
        return agHour === slot.hour && agMinute === slot.minute
      }

      if (agHour !== slot.hour) return false

      if (slot.minute === 0) {
        return (
          agMinute === 0 ||
          (agMinute < 30 && !timeSlots.some((s) => s.isCustom && s.hour === agHour && s.minute === agMinute))
        )
      } else {
        return (
          agMinute === 30 ||
          (agMinute >= 30 && !timeSlots.some((s) => s.isCustom && s.hour === agHour && s.minute === agMinute))
        )
      }
    })
  }

  // Verifica se este slot está COBERTO (mas não é o início) de um agendamento
  // Retorna o agendamento que cobre o slot, ou null
  function getAgendamentoCobrandoSlot(profissionalId: string, slot: TimeSlot): Agendamento | null {
    const agendamentosList = agendamentosPorProfissional.get(profissionalId) || []
    const slotMin = toTotalMinutes(slot.hour, slot.minute)

    for (const ag of agendamentosList) {
      if (ag.status === 'cancelado') continue
      const agDate = new Date(ag.data_hora)
      const agStartMin = toTotalMinutes(agDate.getHours(), agDate.getMinutes())

      // Calcula duração real: itens[] > servico > fallback 30min
      const duracaoItens = ag.itens && ag.itens.length > 0
        ? ag.itens.reduce((acc, it) => acc + (it.duracao_minutos || 0), 0)
        : 0
      const duracao = duracaoItens > 0 ? duracaoItens : (ag.servico?.duracao_minutos || 30)
      const agEndMin = agStartMin + duracao

      // Este slot é coberto se está APÓS o início e ANTES do fim do agendamento
      if (slotMin > agStartMin && slotMin < agEndMin) {
        return ag
      }
    }
    return null
  }

  // Buscar bloqueios pertencentes ao slot de horário
  function getBloqueiosInSlot(profissionalId: string, slot: TimeSlot): BloqueioAgenda[] {
    return bloqueios.filter((bq) => {
      if (bq.profissional_id !== profissionalId) return false
      const start = bq.horario_inicio.slice(0, 5)
      const end = bq.horario_fim.slice(0, 5)
      return slot.label >= start && slot.label < end
    })
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
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto max-h-[78vh] rounded-2xl border border-border bg-card shadow-sm scroll-smooth relative"
      >
        <div className="inline-block min-w-full align-middle">
          {/* Grade de Agenda de Papel */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `90px repeat(${profissionais.length}, minmax(240px, 1fr))`,
            }}
          >
            {/* Cabeçalho da Régua de Horário */}
            <div className="sticky top-0 left-0 z-30 bg-muted/95 backdrop-blur-md border-r border-b border-border p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 shadow-sm">
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
                  className="sticky top-0 z-20 border-b border-r border-border p-3 bg-muted/95 backdrop-blur-md flex flex-col justify-between shadow-sm"
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

            {/* Linhas da Grade de Papel (Com linhas de divisão visíveis em TODOS os horários) */}
            {timeSlots.map((slot) => {
              return (
                <div key={slot.label} className="contents relative">
                  {/* Marcador de Horário na Régua Lateral */}
                  <div
                    ref={(el) => {
                      if (el) slotRefs.current.set(slot.label, el)
                      else slotRefs.current.delete(slot.label)
                    }}
                    className={`sticky left-0 z-10 border-r border-b border-border/80 px-3 py-2 text-[11px] font-sans font-bold flex items-center justify-between ${
                      slot.isFullHour
                        ? 'bg-background/95 backdrop-blur-sm text-foreground'
                        : 'bg-background/85 backdrop-blur-sm text-muted-foreground/80'
                    }`}
                  >
                    <span>{slot.label}</span>
                  </div>

                  {/* Células de cada profissional na linha do horário */}
                  {profissionais.map((prof) => {
                    const slotAgendamentos = getAgendamentosInSlot(prof.id, slot)
                    const slotBloqueios = getBloqueiosInSlot(prof.id, slot)
                    const agendamentoCobrindo = slotAgendamentos.length === 0 && slotBloqueios.length === 0
                      ? getAgendamentoCobrandoSlot(prof.id, slot)
                      : null

                    // Célula que está sendo COBERTA por um agendamento em andamento (faixa de ocupação)
                    if (agendamentoCobrindo) {
                      return (
                        <div
                          key={`${prof.id}-${slot.label}`}
                          className="min-h-[50px] border-r border-b border-border/80 relative overflow-hidden"
                        >
                          {/* Faixa colorida de ocupação com borda lateral esquerda espessa */}
                          <div
                            className={`absolute inset-0 border-l-4 ${
                              agendamentoCobrindo.status === 'agendado'
                                ? 'bg-sky-50/80 dark:bg-sky-950/30 border-l-sky-400'
                                : agendamentoCobrindo.status === 'em_atendimento'
                                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-l-blue-400'
                                : agendamentoCobrindo.status === 'concluido'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-l-emerald-400'
                                : agendamentoCobrindo.status === 'pendente_caixa'
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-l-amber-400'
                                : agendamentoCobrindo.status === 'em_atraso'
                                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-l-rose-400'
                                : 'bg-muted/30 border-l-border'
                            }`}
                          />
                        </div>
                      )
                    }

                    if (slotAgendamentos.length > 0 || slotBloqueios.length > 0) {
                      return (
                        <div
                          key={`${prof.id}-${slot.label}`}
                          className="p-1 min-h-[55px] border-r border-b border-border/80 transition-all bg-background/40"
                        >
                          <div className="flex flex-col gap-1">
                            {/* Exibição dos Bloqueios de Agenda (Card Padrão Uniforme) */}
                            {slotBloqueios.map((bloqueio) => (
                              <Card
                                key={bloqueio.id}
                                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-900/80 rounded-lg shadow-sm"
                              >
                                <CardContent className="p-2 space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="bg-zinc-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                      <Ban className="h-2.5 w-2.5" />
                                      Bloqueado
                                    </span>
                                    {onDeleteBlock && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 hover:bg-red-500/20 text-zinc-500 hover:text-red-600 rounded"
                                        onClick={() => onDeleteBlock(bloqueio.id)}
                                        title="Remover Bloqueio"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate">
                                    {bloqueio.motivo || 'Horário Indisponível'}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-mono">
                                    {bloqueio.horario_inicio.slice(0, 5)} - {bloqueio.horario_fim.slice(0, 5)}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}

                            {/* Agendamentos exibidos LADO A LADO caso haja mais de um no mesmo horário */}
                            {slotAgendamentos.length > 0 && (
                              <div
                                className={`grid gap-1 ${
                                  slotAgendamentos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                                }`}
                              >
                                {slotAgendamentos.map((agendamento) => {
                                  const theme = getStatusTheme(agendamento.status)

                                  return (
                                    <Card
                                      key={agendamento.id}
                                      className={`border rounded-lg transition-all shadow-sm ${theme.cardBg}`}
                                    >
                                      <CardContent className="p-2 space-y-1.5">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className={theme.badgeBg}>
                                            {theme.label}
                                          </span>

                                          {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 w-5 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                                                >
                                                  <MoreVertical className="h-3 w-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-52 border-border text-xs">
                                                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                  Gerenciar Agendamento
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {agendamento.status !== 'em_atendimento' && (
                                                  <DropdownMenuItem onClick={() => onEdit(agendamento)} className="py-2 text-xs font-semibold uppercase tracking-wider">
                                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                                    Editar Detalhes
                                                  </DropdownMenuItem>
                                                )}
                                                {['agendado', 'em_atraso'].includes(agendamento.status) && (
                                                  <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'em_atendimento')} className="py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 font-bold">
                                                    <UserCheck className="h-3.5 w-3.5 mr-2" />
                                                    Iniciar Atendimento
                                                  </DropdownMenuItem>
                                                )}
                                                {agendamento.status === 'em_atendimento' && (
                                                  <DropdownMenuItem onClick={() => onChangeStatus(agendamento, 'pendente_caixa')} className="py-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 font-bold">
                                                    <Check className="h-3.5 w-3.5 mr-2" />
                                                    Finalizar Atendimento
                                                  </DropdownMenuItem>
                                                )}
                                                {!['concluido', 'cancelado', 'pendente_caixa'].includes(agendamento.status) && (
                                                  <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onCancel(agendamento)} className="py-2 text-xs font-semibold uppercase tracking-wider text-red-600">
                                                      <Ban className="h-3.5 w-3.5 mr-2" />
                                                      Cancelar Horário
                                                    </DropdownMenuItem>
                                                  </>
                                                )}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>

                                        <div className="space-y-1 py-0.5">
                                          <p className="font-black text-xs uppercase tracking-wider text-foreground leading-snug truncate">
                                            {agendamento.cliente?.nome}
                                          </p>
                                          <p className="font-bold text-[11px] uppercase tracking-wide text-foreground/85 flex items-center gap-1.5 leading-snug truncate">
                                            <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-75 text-primary" />
                                            <span className="truncate">{agendamento.servico?.nome}</span>
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }

                    // Linha/Célula vazia estilo Agenda de Papel (com linha de divisão visível em todos os horários)
                    return (
                      <div
                        key={`${prof.id}-${slot.label}`}
                        onClick={() => handleCellClick(prof.id, slot)}
                        className="p-1 min-h-[50px] border-r border-b border-border/80 transition-all group cursor-pointer relative bg-background/30 hover:bg-emerald-500/5"
                        title={`Clique para agendar às ${slot.label} com ${prof.nome}`}
                      >
                        <div className="h-full w-full rounded border border-transparent group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/40 group-hover:text-emerald-600 font-bold transition-all">
                          <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider text-[9px]">
                            Agendar às {slot.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Espaçador de rolagem inferior */}
            <div className="sticky left-0 border-r border-border p-3 bg-muted/20 text-[10px] font-sans text-muted-foreground/60 flex items-center">
              ••:••
            </div>
            <div
              className="border-b border-transparent h-[380px] bg-muted/5 flex items-center justify-center text-[10px] text-muted-foreground/40 font-sans uppercase tracking-widest"
              style={{ gridColumn: `span ${profissionais.length}` }}
            >
              — Fim das 24 Horas do Dia —
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
