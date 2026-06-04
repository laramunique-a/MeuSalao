import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCaixasByPeriod, useTransacoesByCaixa, useCaixaSummary } from '@/hooks/useCaixa'
import { useAuthStore } from '@/store/authStore'
import { CaixaDiario } from '@/types/models'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
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
        className="hover:bg-slate-50/40 cursor-pointer transition-colors border-b last:border-0"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {format(new Date(caixa.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
            <span className="text-[10px] text-muted-foreground ml-1" title={caixa.id}>
              #{caixa.id.slice(0, 6).toUpperCase()}
            </span>
            <span className="text-[10px] bg-slate-100 px-1 rounded ml-1 font-normal" title={`Aberto por: ${caixa.usuario_abertura?.nome}`}>
              {caixa.usuario_abertura?.nome.split(' ')[0]}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
          {format(new Date(caixa.data_abertura), "HH:mm")} →{' '}
          {caixa.data_fechamento ? format(new Date(caixa.data_fechamento), "HH:mm") : <span className="text-emerald-600 font-bold">Aberto</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold">{fmt(caixa.valor_inicial)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-primary">{fmt(caixa.valor_fechamento_sistema)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold">{fmt(caixa.valor_fechamento_informado)}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          {diff != null ? (
            <Badge
              className={`text-[10px] font-bold px-2 h-5 border-none rounded-full ${
                Math.abs(diff) < 0.01
                  ? 'bg-emerald-100 text-emerald-700'
                  : diff < 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {diff >= 0 ? '+' : ''}{fmt(diff)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-bold px-2 h-5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">Aberto</Badge>
          )}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="bg-slate-50/60 border-b px-4 py-4">
            {isLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Carregando movimentações...</p>
            ) : transacoes?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma movimentação nesta sessão.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white border-b text-muted-foreground font-bold uppercase text-[10px]">
                      <th className="px-3 py-2 text-left">Horário</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-left">Operador</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Forma</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {transacoes?.map((t) => (
                      <tr key={t.id} className={t.status !== 'ativo' ? 'opacity-40 grayscale' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {format(new Date(t.data_hora), 'HH:mm')}
                        </td>
                        <td className="px-3 py-2 font-medium min-w-[150px]">{t.descricao}</td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{t.usuario?.nome || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge variant="outline" className="text-[9px] font-bold rounded-lg px-1.5 h-4 border-slate-200 uppercase whitespace-nowrap">
                            {t.categoria || 'Geral'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground capitalize whitespace-nowrap">
                          {t.forma_pagamento.replace('_', ' ')}
                        </td>
                        <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'} {fmt(t.valor)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {t.status === 'ativo' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-full text-[9px] font-bold px-2 h-4">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-rose-600 border-rose-100 rounded-full text-[9px] font-bold px-2 h-4 capitalize">{t.status}</Badge>
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
  const [startDate, setStartDate] = useState(format(startOfMonth(hoje), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(hoje), 'yyyy-MM-dd'))

  const { data: caixas, isLoading } = useCaixasByPeriod(
    startOfDay(new Date(startDate + 'T00:00:00')).toISOString(),
    endOfDay(new Date(endDate + 'T00:00:00')).toISOString()
  )

  const { data: summary } = useCaixaSummary(
    startOfDay(new Date(startDate + 'T00:00:00')).toISOString(),
    endOfDay(new Date(endDate + 'T00:00:00')).toISOString()
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filtros de Período */}
      <div className="flex flex-wrap items-center gap-3 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Período
        </div>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-8 w-auto text-xs rounded-lg"
        />
        <span className="text-muted-foreground text-xs">até</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-8 w-auto text-xs rounded-lg"
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {isAdmin && (
          <>
            <Card className="rounded-2xl border shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sessões</p>
                  <p className="text-xl font-black text-slate-800">{caixas?.length ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fechadas</p>
                  <p className="text-xl font-black text-slate-800">{sessoesFechadas}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm col-span-1">
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
            <Card className="rounded-2xl border shadow-sm col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50">
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aberturas</p>
                  <p className="text-sm font-black text-amber-700">{fmt(totalAberturas)}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card className={`rounded-2xl border shadow-sm ${!isAdmin ? 'col-span-2' : 'col-span-2 lg:col-span-1'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50">
              <DollarSign className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Comissões</p>
              <p className="text-sm font-black text-violet-700">{fmt(summary?.comissoes ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Sessões */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sessões de Caixa</h3>
          {sessoesAbertas > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-full text-[9px] font-bold px-2 h-4 ml-1">
              {sessoesAbertas} aberto
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground font-bold text-[10px] uppercase bg-slate-50/50 border-b">
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

        <div className="p-3 border-t bg-slate-50/30">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            Clique em uma sessão para ver as movimentações detalhadas.
          </p>
        </div>
      </div>
    </div>
  )
}
