import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, addMonths, differenceInDays, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCaixasByPeriod, useTransacoesByCaixa, useCaixaSummary } from '@/hooks/useCaixa'
import { useAuthStore } from '@/store/authStore'
import { CaixaDiario } from '@/types/models'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DateNavigator } from '@/components/ui/date-navigator'
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  DollarSign,
} from 'lucide-react'

const fmt = (n: number | null | undefined) =>
  n != null ? Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

function SessionRow({ caixa }: { caixa: CaixaDiario }) {
  const [expanded, setExpanded] = useState(false)
  const { data: transacoes, isLoading } = useTransacoesByCaixa(expanded ? caixa.id : null)

  const diff =
    caixa.valor_fechamento_informado != null && caixa.valor_fechamento_sistema != null
      ? Number(caixa.valor_fechamento_informado) - Number(caixa.valor_fechamento_sistema)
      : null

  return (
    <>
      <tr
        className="hover:bg-accent/20 cursor-pointer transition-colors border-b border-border last:border-0"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {format(new Date(caixa.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
            <span className="text-[10px] text-muted-foreground ml-1" title={caixa.id}>
              #{caixa.id.slice(0, 6).toUpperCase()}
            </span>
            <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded ml-1 font-normal" title={`Aberto por: ${caixa.usuario_abertura?.nome}`}>
              {caixa.usuario_abertura?.nome.split(' ')[0]}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
          {format(new Date(caixa.data_abertura), "HH:mm")} →{' '}
          {caixa.data_fechamento ? format(new Date(caixa.data_fechamento), "HH:mm") : <span className="text-emerald-600 dark:text-emerald-400 font-bold">Aberto</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-foreground">{fmt(caixa.valor_inicial)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-primary">{fmt(caixa.valor_fechamento_sistema)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-foreground">{fmt(caixa.valor_fechamento_informado)}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          {diff != null ? (
            <Badge
              className={`text-[10px] font-bold px-2 h-5 border-none rounded-full ${
                Math.abs(diff) < 0.01
                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : diff < 0
                  ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                  : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
              }`}
            >
              {diff >= 0 ? '+' : ''}{fmt(diff)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-bold px-2 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30">Aberto</Badge>
          )}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="bg-accent/5 border-b border-border px-4 py-4">
            {isLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Carregando movimentações...</p>
            ) : transacoes?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma movimentação nesta sessão.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-card border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                      <th className="px-3 py-2 text-left">Horário</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-left">Operador</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Forma</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {transacoes?.map((t) => (
                      <tr key={t.id} className={t.status !== 'ativo' ? 'opacity-40 grayscale' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {format(new Date(t.data_hora), 'HH:mm')}
                        </td>
                        <td className="px-3 py-2 font-medium min-w-[150px] text-foreground">{t.descricao}</td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{t.usuario?.nome || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge variant="outline" className="text-[9px] font-bold rounded-lg px-1.5 h-4 border-border bg-accent/10 text-foreground uppercase whitespace-nowrap">
                            {t.categoria || 'Geral'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground capitalize whitespace-nowrap">
                          {t.forma_pagamento.replace('_', ' ')}
                        </td>
                        <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${t.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'} {fmt(t.valor)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {t.status === 'ativo' ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border-none rounded-full text-[9px] font-bold px-2 h-4">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/30 rounded-full text-[9px] font-bold px-2 h-4 capitalize">{t.status}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function HistoricoCaixa() {
  const hoje = new Date()
  const [range, setRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(hoje),
    to: endOfMonth(hoje)
  })

  const { data: caixas, isLoading } = useCaixasByPeriod(
    startOfDay(range.from).toISOString(),
    endOfDay(range.to).toISOString()
  )

  const { data: summary } = useCaixaSummary(
    startOfDay(range.from).toISOString(),
    endOfDay(range.to).toISOString()
  )

  const { isAdmin } = useAuthStore()

  // Para caixas fechados usa o saldo do sistema; para abertos usa o valor inicial como referência mínima
  const totalEntradas = caixas?.reduce(
    (acc, c) => acc + (c.valor_fechamento_sistema != null
      ? Number(c.valor_fechamento_sistema)
      : Number(c.valor_inicial)), 0
  ) ?? 0

  const totalAberturas = caixas?.reduce(
    (acc, c) => acc + Number(c.valor_inicial), 0
  ) ?? 0

  const sessoesFechadas = caixas?.filter(c => c.status === 'fechado').length ?? 0
  const sessoesAbertas = caixas?.filter(c => c.status === 'aberto').length ?? 0

  const handlePrevious = () => {
    const days = differenceInDays(range.to, range.from) + 1
    const isFullMonth = 
      format(range.from, 'yyyy-MM-dd') === format(startOfMonth(range.from), 'yyyy-MM-dd') &&
      format(range.to, 'yyyy-MM-dd') === format(endOfMonth(range.to), 'yyyy-MM-dd')

    if (isFullMonth) {
      const prevMonth = subMonths(range.from, 1)
      setRange({
        from: startOfMonth(prevMonth),
        to: endOfMonth(prevMonth)
      })
    } else {
      setRange({
        from: subDays(range.from, days),
        to: subDays(range.to, days)
      })
    }
  }

  const handleNext = () => {
    const days = differenceInDays(range.to, range.from) + 1
    const isFullMonth = 
      format(range.from, 'yyyy-MM-dd') === format(startOfMonth(range.from), 'yyyy-MM-dd') &&
      format(range.to, 'yyyy-MM-dd') === format(endOfMonth(range.to), 'yyyy-MM-dd')

    if (isFullMonth) {
      const nextMonth = addMonths(range.from, 1)
      setRange({
        from: startOfMonth(nextMonth),
        to: endOfMonth(nextMonth)
      })
    } else {
      setRange({
        from: addDays(range.from, days),
        to: addDays(range.to, days)
      })
    }
  }

  const handleToday = () => {
    setRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  }

  const isCurrentMonth = 
    format(range.from, 'yyyy-MM-dd') === format(startOfMonth(new Date()), 'yyyy-MM-dd') &&
    format(range.to, 'yyyy-MM-dd') === format(endOfMonth(new Date()), 'yyyy-MM-dd')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filtros de Período */}
      <div className="flex flex-wrap items-center gap-3">
        <DateNavigator
          mode="range"
          selectedRange={range}
          onSelectRange={setRange}
          onPrev={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          labelToday="ESTE MÊS"
          isTodayActive={isCurrentMonth}
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {isAdmin && (
          <>
            <Card className="rounded-2xl border border-border bg-card shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sessões</p>
                  <p className="text-xl font-black text-foreground">{caixas?.length ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border bg-card shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fechadas</p>
                  <p className="text-xl font-black text-foreground">{sessoesFechadas}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border bg-card shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Movimentado</p>
                  <p className="text-sm font-black text-primary">{fmt(totalEntradas)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border bg-card shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aberturas</p>
                  <p className="text-sm font-black text-amber-700 dark:text-amber-400">{fmt(totalAberturas)}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card className={`rounded-2xl border border-border bg-card shadow-sm ${!isAdmin ? 'col-span-2' : 'col-span-2 lg:col-span-1'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30">
              <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Comissões</p>
              <p className="text-sm font-black text-violet-700 dark:text-violet-400">{fmt(summary?.comissoes ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Sessões */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-accent/5 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sessões de Caixa</h3>
          {sessoesAbertas > 0 && (
            <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none rounded-full text-[9px] font-bold px-2 h-4 ml-1">
              {sessoesAbertas} aberto
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground font-bold text-[10px] uppercase bg-accent/5 border-b border-border">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Valor Inicial</th>
                <th className="px-4 py-3">Saldo Sistema</th>
                <th className="px-4 py-3">Valor Informado</th>
                <th className="px-4 py-3">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                    Carregando sessões...
                  </td>
                </tr>
              ) : !caixas || caixas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">
                    Nenhuma sessão de caixa encontrada no período.
                  </td>
                </tr>
              ) : (
                caixas.map((caixa) => <SessionRow key={caixa.id} caixa={caixa} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-border bg-accent/5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            Clique em uma sessão para ver as movimentações detalhadas.
          </p>
        </div>
      </div>
    </div>
  )
}
