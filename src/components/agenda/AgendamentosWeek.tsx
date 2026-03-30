import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Agendamento } from '@/types/models'
import { cn } from '@/lib/utils'
import { Clock, User, Ban, Trash2 } from 'lucide-react'
import type { BloqueioAgenda } from '@/types/models'

interface AgendamentosWeekProps {
    agendamentos: Agendamento[]
    bloqueios?: BloqueioAgenda[]
    selectedDate: Date
    filterProfissional?: string
    onEdit: (agendamento: Agendamento) => void
    onCancel: (agendamento: Agendamento) => void
    onChangeStatus: (agendamento: Agendamento, status: Agendamento['status']) => void
    onDeleteBlock: (id: string) => void
}

export function AgendamentosWeek({
    agendamentos,
    bloqueios = [],
    selectedDate,
    filterProfissional = 'todos',
    onEdit,
    onDeleteBlock,
}: AgendamentosWeekProps) {
    const start = startOfWeek(selectedDate, { locale: ptBR })
    const end = endOfWeek(selectedDate, { locale: ptBR })
    const days = eachDayOfInterval({ start, end })

    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 overflow-hidden">
            {days.map((day) => {
                const dayAgendamentos = agendamentos.filter((ag) =>
                    isSameDay(new Date(ag.data_hora), day)
                )

                const dayBloqueios = bloqueios.filter((bq) => {
                    const blockStart = new Date(bq.data_inicio)
                    const blockEnd = new Date(bq.data_fim)
                    // Check if day matches any day in the range [blockStart, blockEnd]
                    return isSameDay(day, blockStart) || isSameDay(day, blockEnd) || (day > blockStart && day < blockEnd)
                })

                const mergedItems = [
                    ...dayAgendamentos.map(ag => ({ type: 'agendamento' as const, data: ag, time: format(new Date(ag.data_hora), 'HH:mm') })),
                    ...dayBloqueios.map(bq => ({ type: 'bloqueio' as const, data: bq, time: bq.horario_inicio.slice(0, 5) }))
                ].sort((a, b) => a.time.localeCompare(b.time))

                const isToday = isSameDay(day, new Date())
                const isSelected = isSameDay(day, selectedDate)

                return (
                    <div key={day.toString()} className="flex flex-col h-full min-w-0">
                        <Card className={cn(
                            "flex flex-col h-full min-h-[400px] border-gray-200 dark:border-gray-800",
                            isToday && "border-primary bg-primary/5 dark:bg-primary/10",
                            isSelected && !isToday && "border-blue-400 bg-blue-50/10"
                        )}>
                            <CardHeader className="p-3 border-b text-center space-y-0">
                                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                                    {format(day, 'EEEE', { locale: ptBR }).split('-')[0]}
                                </p>
                                <CardTitle className="text-xl font-bold">
                                    {format(day, 'dd')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 flex-1 overflow-y-auto space-y-2 max-h-[600px]">
                                {mergedItems.length === 0 ? (
                                    <p className="text-center text-[10px] text-gray-400 py-8 italic uppercase tracking-tighter">Vazio</p>
                                ) : (
                                    mergedItems.map((item) => {
                                        if (item.type === 'agendamento') {
                                            const ag = item.data
                                            return (
                                                <div
                                                    key={ag.id}
                                                    onClick={() => onEdit(ag)}
                                                    className={cn(
                                                        "p-2 rounded-lg border text-[11px] cursor-pointer transition-all hover:shadow-md",
                                                        ag.status === 'cancelado' ? "opacity-50 line-through bg-gray-100" : "bg-white dark:bg-gray-900 hover:border-primary border-gray-100 dark:border-gray-800"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold flex items-center gap-1 text-primary">
                                                            <Clock className="h-3 w-3" />
                                                            {item.time}
                                                        </span>
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            ag.status === 'concluido' ? "bg-green-700" :
                                                                ag.status === 'pendente_caixa' ? "bg-purple-500" :
                                                                    ag.status === 'em_atendimento' ? "bg-yellow-500" :
                                                                        ag.status === 'em_atraso' ? "bg-orange-500" :
                                                                            ag.status === 'cancelado' ? "bg-red-500" : "bg-blue-500"
                                                        )} />
                                                    </div>
                                                    <div className="font-semibold truncate uppercase tracking-tight">{ag.cliente?.nome}</div>
                                                    {filterProfissional === 'todos' && (
                                                        <div className="text-gray-500 flex items-center gap-1 truncate text-[10px]">
                                                            <User className="h-3 w-3 opacity-70" />
                                                            {ag.profissional?.nome}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        } else {
                                            const bq = item.data
                                            return (
                                                <div
                                                    key={bq.id}
                                                    className="p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] opacity-80"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold flex items-center gap-1 text-zinc-500">
                                                            <Ban className="h-3 w-3" />
                                                            {bq.horario_inicio.slice(0, 5)} <span className="text-[9px] font-normal opacity-50">até</span> {bq.horario_fim.slice(0, 5)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteBlock(bq.id);
                                                            }}
                                                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                                            title="Remover Bloqueio"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="font-bold text-zinc-600 dark:text-zinc-400 truncate uppercase tracking-tighter">BLOQUEADO</div>
                                                    <div className="text-zinc-400 dark:text-zinc-500 italic truncate">{bq.motivo || 'Indisponível'}</div>
                                                    {filterProfissional === 'todos' && (
                                                        <div className="text-zinc-400/80 flex items-center gap-1 truncate text-[9px] mt-1">
                                                            <User className="h-3 w-3 opacity-70" />
                                                            {bq.profissional?.nome}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
}
