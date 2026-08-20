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

// Altura em pixels de cada slot de 30 minutos
const SLOT_HEIGHT_PX = 56

// Grade fixa de slots de 30 em 30 minutos (00:00 a 23:30)
const STANDARD_SLOTS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: (i % 2) * 30,
  label: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
  isFullHour: i % 2 === 0,
}))

// Altura total da coluna de conteudo (24h x 2 slots x 56px = 2688px)
const TOTAL_HEIGHT_PX = STANDARD_SLOTS.length * SLOT_HEIGHT_PX

/** Converte minutos desde meia-noite em pixels verticais */
function minutesToPx(minutes: number): number {
  return (minutes / 30) * SLOT_HEIGHT_PX
}

export function getStatusTheme(status: Agendamento['status']) {
  switch (status) {
    case 'concluido':
      return {
        cardBg: 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 shadow-sm',
        badgeBg: 'bg-emerald-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm',
        label: 'Concluido',
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
  const [now, setNow] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const isToday = isSameDay(selectedDate, now)

  // Agrupar agendamentos por profissional
  const agendamentosPorProfissional = useMemo(() => {
    const grouped = new Map<string, Agendamento[]>()
    profissionais.forEach(prof => grouped.set(prof.id, []))
    agendamentos.forEach(ag => {
      const list = grouped.get(ag.profissional_id) || []
      list.push(ag)
      grouped.set(ag.profissional_id, list)
    })
    return grouped
  }, [agendamentos, profissionais])

  // Auto-scroll para o horario atual
  useEffect(() => {
    if (!isToday) return

    const scrollToNow = (smooth: boolean) => {
      if (!containerRef.current) return
      const n = new Date()
      const px = minutesToPx(n.getHours() * 60 + n.getMinutes())
      containerRef.current.scrollTo({
        top: Math.max(0, px - 150),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }

    const timeout = setTimeout(() => scrollToNow(false), 150)
    const timer = setInterval(() => {
      setNow(new Date())
      scrollToNow(true)
    }, 30000)

    return () => {
      clearTimeout(timeout)
      clearInterval(timer)
    }
  }, [isToday, selectedDate])

  /** Calcula duracao real do agendamento em minutos */
  function getDuracao(ag: Agendamento): number {
    const duracaoItens =
      ag.itens && ag.itens.length > 0
        ? ag.itens.reduce((acc, it) => acc + (it.duracao_minutos || 0), 0)
        : 0
    return duracaoItens > 0 ? duracaoItens : ag.servico?.duracao_minutos || 30
  }

  function handleCellClick(profissionalId: string, slot: { hour: number; minute: number }) {
    if (!onSlotClick) return
    const slotDate = setMinutes(setHours(new Date(selectedDate), slot.hour), slot.minute)
    onSlotClick(profissionalId, slotDate)
  }

  if (profissionais.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-wider">
        Nenhum profissional cadastrado para o salao.
      </div>
    )
  }

  const nowTopPx = minutesToPx(now.getHours() * 60 + now.getMinutes())

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-auto max-h-[78vh] rounded-2xl border border-border bg-card shadow-sm scroll-smooth"
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `90px repeat(${profissionais.length}, minmax(240px, 1fr))`,
          }}
        >
          {/* CABECALHO */}
          <div className="sticky top-0 left-0 z-30 bg-muted/95 backdrop-blur-md border-r border-b border-border p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            Horario
          </div>

          {profissionais.map(prof => {
            const profAgendamentos = agendamentosPorProfissional.get(prof.id) || []
            const totalAtivos = profAgendamentos.filter(a => a.status !== 'cancelado').length
            return (
              <div key={prof.id} className="sticky top-0 z-20 border-b border-r border-border p-3 bg-muted/95 backdrop-blur-md flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {prof.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-foreground uppercase tracking-wider truncate">{prof.nome}</p>
                    <p className="text-[9px] text-muted-foreground capitalize truncate">{prof.perfil || 'Profissional'}</p>
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-semibold text-muted-foreground">
                  <span className="bg-background px-2 py-0.5 rounded border border-border">
                    {totalAtivos} {totalAtivos === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>
              </div>
            )
          })}

          {/* REGUA LATERAL DE HORARIOS */}
          <div
            className="sticky left-0 z-10 border-r border-border bg-background/95 backdrop-blur-sm relative"
            style={{ height: `${TOTAL_HEIGHT_PX}px` }}
          >
            {STANDARD_SLOTS.map((slot, i) => (
              <div
                key={slot.label}
                className={`absolute left-0 right-0 flex items-start px-3 pt-1.5 border-b ${
                  slot.isFullHour
                    ? 'border-border/70 text-foreground'
                    : 'border-border/30 text-muted-foreground/60'
                }`}
                style={{ top: `${i * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
              >
                <span className={`font-bold font-sans leading-none ${slot.isFullHour ? 'text-[11px]' : 'text-[10px]'}`}>
                  {slot.label}
                </span>
              </div>
            ))}
            {isToday && (
              <div
                className="absolute right-[-4px] z-20 w-2 h-2 rounded-full bg-red-500 pointer-events-none"
                style={{ top: `${nowTopPx}px`, transform: 'translateY(-50%)' }}
              />
            )}
          </div>

          {/* COLUNAS DOS PROFISSIONAIS */}
          {profissionais.map(prof => {
            const profAgendamentos = agendamentosPorProfissional.get(prof.id) || []
            const profBloqueios = bloqueios.filter(b => b.profissional_id === prof.id)

            return (
              <div
                key={prof.id}
                className="relative border-r border-border"
                style={{ height: `${TOTAL_HEIGHT_PX}px` }}
              >
                {/* Grade de linhas clicaveis */}
                {STANDARD_SLOTS.map((slot, i) => (
                  <div
                    key={slot.label}
                    className={`absolute left-0 right-0 border-b group cursor-pointer transition-colors hover:bg-emerald-500/5 ${
                      slot.isFullHour ? 'border-border/60' : 'border-border/25'
                    }`}
                    style={{ top: `${i * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
                    onClick={() => handleCellClick(prof.id, slot)}
                    title={`Agendar as ${slot.label} com ${prof.nome}`}
                  >
                    <div className="h-full flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Plus className="h-3 w-3 text-emerald-600" />
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                        Agendar as {slot.label}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Linha do horario atual */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: `${nowTopPx}px` }}
                  >
                    <div className="relative border-t-2 border-red-500">
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-red-500 left-0 top-0 -translate-y-1/2 -translate-x-1/2" />
                    </div>
                  </div>
                )}

                {/* BLOQUEIOS */}
                {profBloqueios.map(bloqueio => {
                  const shParts = bloqueio.horario_inicio.split(':').map(Number)
                  const ehParts = bloqueio.horario_fim.split(':').map(Number)
                  const sh = shParts[0] || 0
                  const sm = shParts[1] || 0
                  const eh = ehParts[0] || 0
                  const em = ehParts[1] || 0
                  const topPx = minutesToPx(sh * 60 + sm)
                  const heightPx = Math.max(minutesToPx((eh * 60 + em) - (sh * 60 + sm)), SLOT_HEIGHT_PX)

                  return (
                    <div
                      key={bloqueio.id}
                      className="absolute left-1 right-1 z-10"
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <Card className="h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-900/80 rounded-lg shadow-sm overflow-hidden">
                        <CardContent className="p-2 h-full flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-1 flex-shrink-0">
                            <span className="bg-zinc-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Ban className="h-2.5 w-2.5" />
                              Bloqueado
                            </span>
                            {onDeleteBlock && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-red-500/20 text-zinc-500 hover:text-red-600 rounded"
                                onClick={e => { e.stopPropagation(); onDeleteBlock(bloqueio.id) }}
                                title="Remover Bloqueio"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate">
                            {bloqueio.motivo || 'Horario Indisponivel'}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {bloqueio.horario_inicio.slice(0, 5)} - {bloqueio.horario_fim.slice(0, 5)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}

                {/* AGENDAMENTOS - altura proporcional a duracao */}
                {profAgendamentos.map(ag => {
                  if (ag.status === 'cancelado') return null

                  const d = new Date(ag.data_hora)
                  const startMin = d.getHours() * 60 + d.getMinutes()
                  const topPx = minutesToPx(startMin)
                  const duracao = getDuracao(ag)
                  const heightPx = Math.max(minutesToPx(duracao), SLOT_HEIGHT_PX * 0.85)
                  const theme = getStatusTheme(ag.status)

                  const borderColor =
                    ag.status === 'agendado' ? '#38bdf8'
                    : ag.status === 'em_atendimento' ? '#3b82f6'
                    : ag.status === 'concluido' ? '#10b981'
                    : ag.status === 'pendente_caixa' ? '#f59e0b'
                    : ag.status === 'em_atraso' ? '#f43f5e'
                    : '#94a3b8'

                  return (
                    <div
                      key={ag.id}
                      className="absolute left-1 right-1 z-20"
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <Card
                        className={`h-full rounded-lg transition-all shadow-sm overflow-hidden border-l-4 ${theme.cardBg}`}
                        style={{ borderLeftColor: borderColor }}
                      >
                        <CardContent className="p-2 h-full flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                              <span className={`${theme.badgeBg} flex-shrink-0`}>{theme.label}</span>
                              {/* Horario discreto ao lado do status */}
                              {(() => {
                                const inicio = new Date(ag.data_hora)
                                const fim = new Date(inicio.getTime() + getDuracao(ag) * 60000)
                                const fmt = (d: Date) =>
                                  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}h`
                                return (
                                  <span className="text-[9px] text-foreground/50 font-medium truncate leading-none">
                                    {fmt(inicio)} às {fmt(fim)}
                                  </span>
                                )
                              })()}
                            </div>
                            {!['concluido', 'cancelado', 'pendente_caixa'].includes(ag.status) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 border-border text-xs">
                                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Gerenciar Agendamento
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {ag.status !== 'em_atendimento' && (
                                    <DropdownMenuItem onClick={() => onEdit(ag)} className="py-2 text-xs font-semibold uppercase tracking-wider">
                                      <Pencil className="h-3.5 w-3.5 mr-2" />
                                      Editar Detalhes
                                    </DropdownMenuItem>
                                  )}
                                  {['agendado', 'em_atraso'].includes(ag.status) && (
                                    <DropdownMenuItem onClick={() => onChangeStatus(ag, 'em_atendimento')} className="py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 font-bold">
                                      <UserCheck className="h-3.5 w-3.5 mr-2" />
                                      Iniciar Atendimento
                                    </DropdownMenuItem>
                                  )}
                                  {ag.status === 'em_atendimento' && (
                                    <DropdownMenuItem onClick={() => onChangeStatus(ag, 'pendente_caixa')} className="py-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 font-bold">
                                      <Check className="h-3.5 w-3.5 mr-2" />
                                      Finalizar Atendimento
                                    </DropdownMenuItem>
                                  )}
                                  {!['concluido', 'cancelado', 'pendente_caixa'].includes(ag.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onCancel(ag)} className="py-2 text-xs font-semibold uppercase tracking-wider text-red-600">
                                        <Ban className="h-3.5 w-3.5 mr-2" />
                                        Cancelar Horario
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          <div className="flex-1 overflow-hidden min-h-0">
                            <p className="font-black text-xs uppercase tracking-wider text-foreground leading-snug truncate">
                              {ag.cliente?.nome}
                            </p>
                            <p className="font-bold text-[11px] uppercase tracking-wide text-foreground/85 flex items-center gap-1.5 leading-snug truncate mt-0.5">
                              <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-75 text-primary" />
                              <span className="truncate">{ag.servico?.nome}</span>
                            </p>

                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
