import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, addMonths, differenceInDays, subDays, addDays } from 'date-fns'
import { useCaixasByPeriod, useTransacoesByCaixa, useCaixaSummary, useReabrirCaixa, useAjustarCaixaFechado } from '@/hooks/useCaixa'
import { useAuthStore } from '@/store/authStore'
import { CaixaDiario } from '@/types/models'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DateNavigator } from '@/components/ui/date-navigator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  DollarSign,
  RotateCcw,
  Pencil,
  FileText,
} from 'lucide-react'

const fmt = (n: number | null | undefined) =>
  n != null ? Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

function SessionRow({ caixa }: { caixa: CaixaDiario }) {
  const { toast } = useToast()
  const { isAdmin } = useAuthStore()
  const [expanded, setExpanded] = useState(false)
  const { data: transacoes, isLoading } = useTransacoesByCaixa(expanded ? caixa.id : null)

  const reabrirCaixa = useReabrirCaixa()
  const ajustarCaixa = useAjustarCaixaFechado()

  const [isReabrirOpen, setIsReabrirOpen] = useState(false)
  const [justificativaReabrir, setJustificativaReabrir] = useState('')

  const [isAjustarOpen, setIsAjustarOpen] = useState(false)
  const [novoValorInformado, setNovoValorInformado] = useState('')
  const [justificativaAjustar, setJustificativaAjustar] = useState('')

  async function handleConfirmReabrir() {
    if (!justificativaReabrir || justificativaReabrir.trim().length < 5) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe uma justificativa com no mínimo 5 caracteres para reabrir este caixa.',
        variant: 'destructive',
      })
      return
    }
    try {
      await reabrirCaixa.mutateAsync({ caixaId: caixa.id, justificativa: justificativaReabrir })
      toast({
        title: 'Caixa reaberto!',
        description: 'A sessão de caixa foi reaberta com registro na auditoria.',
      })
      setIsReabrirOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao reabrir caixa',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  async function handleConfirmAjustar() {
    const clean = novoValorInformado.replace(/[^\d.,]/g, '').replace(',', '.')
    const valNum = Number(clean)
    if (isNaN(valNum) || valNum < 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor válido maior ou igual a zero.',
        variant: 'destructive',
      })
      return
    }
    if (!justificativaAjustar || justificativaAjustar.trim().length < 5) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe uma justificativa com no mínimo 5 caracteres para registrar o ajuste.',
        variant: 'destructive',
      })
      return
    }
    try {
      await ajustarCaixa.mutateAsync({
        caixaId: caixa.id,
        novoValorInformado: valNum,
        justificativa: justificativaAjustar,
      })
      toast({
        title: 'Ajuste registrado!',
        description: 'O valor informado do fechamento foi atualizado com auditoria.',
      })
      setIsAjustarOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar ajuste',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const diff =
    caixa.valor_fechamento_informado != null && caixa.valor_fechamento_sistema != null
      ? Number(caixa.valor_fechamento_informado) - Number(caixa.valor_fechamento_sistema)
      : null

  const dataAberturaStr = format(new Date(caixa.data_abertura), 'dd/MM/yyyy')
  const dataFechamentoStr = caixa.data_fechamento ? format(new Date(caixa.data_fechamento), 'dd/MM/yyyy') : null

  const dataExibicao = caixa.status === 'fechado' && dataFechamentoStr && dataFechamentoStr !== dataAberturaStr
    ? `${dataAberturaStr} a ${dataFechamentoStr}`
    : dataAberturaStr

  return (
    <>
      <tr
        className="hover:bg-accent/20 cursor-pointer transition-colors border-b border-border last:border-0"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {dataExibicao}
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
                      <th className="px-3 py-2 text-left">Data / Hora</th>
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
                          {format(new Date(t.data_hora), 'dd/MM/yyyy HH:mm')}
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

            {/* Histórico de Auditoria e Observações */}
            {caixa.observacoes && (
              <div className="mt-3 p-3 bg-card rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Observações e Histórico de Auditoria
                </span>
                <p className="text-[11px] text-foreground font-medium whitespace-pre-line leading-relaxed">
                  {caixa.observacoes}
                </p>
              </div>
            )}

            {/* Ações de Administração Auditadas (Reabrir ou Ajustar Fechamento) */}
            {isAdmin && caixa.status === 'fechado' && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px] font-semibold gap-1.5 rounded-lg border-border hover:bg-accent"
                  onClick={() => {
                    setNovoValorInformado(caixa.valor_fechamento_informado != null ? Number(caixa.valor_fechamento_informado).toFixed(2).replace('.', ',') : '')
                    setJustificativaAjustar('')
                    setIsAjustarOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Ajustar Fechamento
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px] font-semibold gap-1.5 rounded-lg border-amber-300 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  onClick={() => {
                    setJustificativaReabrir('')
                    setIsReabrirOpen(true)
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                  Reabrir Caixa
                </Button>
              </div>
            )}
          </td>
        </tr>
      )}

      {/* DIALOG DE REABERTURA AUDITADA */}
      <Dialog open={isReabrirOpen} onOpenChange={setIsReabrirOpen}>
        <DialogContent className="sm:max-w-[440px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
              Reabrir Sessão de Caixa
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A reabertura tornará este caixa aberto novamente. Esta ação e sua justificativa obrigatória serão gravadas permanentemente na auditoria do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="justificativa_reabrir" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>Justificativa Obrigatória</span>
                <span className="text-red-500 font-bold">* Mínimo 5 caracteres</span>
              </Label>
              <Textarea
                id="justificativa_reabrir"
                placeholder="Informe o motivo da reabertura deste caixa..."
                value={justificativaReabrir}
                onChange={(e) => setJustificativaReabrir(e.target.value)}
                rows={3}
                required
                className="rounded-lg border-border text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReabrirOpen(false)}
              className="text-xs uppercase tracking-wider h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={reabrirCaixa.isPending || justificativaReabrir.trim().length < 5}
              onClick={handleConfirmReabrir}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs uppercase tracking-wider h-9"
            >
              {reabrirCaixa.isPending ? 'Reabrindo...' : 'Confirmar Reabertura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE AJUSTE AUDITADO */}
      <Dialog open={isAjustarOpen} onOpenChange={setIsAjustarOpen}>
        <DialogContent className="sm:max-w-[440px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Pencil className="h-5 w-5 text-primary" />
              Ajustar Valor Informado
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Altere o valor conferido desta sessão de caixa fechada. O valor anterior e a justificativa serão salvos no histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="novo_valor_inf" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Novo Valor Informado (R$)
              </Label>
              <Input
                id="novo_valor_inf"
                value={novoValorInformado}
                onChange={(e) => setNovoValorInformado(e.target.value)}
                placeholder="0,00"
                className="h-10 rounded-lg border-border text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="justificativa_ajuste" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>Justificativa Obrigatória</span>
                <span className="text-red-500 font-bold">* Mínimo 5 caracteres</span>
              </Label>
              <Textarea
                id="justificativa_ajuste"
                placeholder="Informe o motivo deste ajuste de fechamento..."
                value={justificativaAjustar}
                onChange={(e) => setJustificativaAjustar(e.target.value)}
                rows={3}
                required
                className="rounded-lg border-border text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAjustarOpen(false)}
              className="text-xs uppercase tracking-wider h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={ajustarCaixa.isPending || justificativaAjustar.trim().length < 5}
              onClick={handleConfirmAjustar}
              className="bg-primary text-primary-foreground text-xs uppercase tracking-wider h-9"
            >
              {ajustarCaixa.isPending ? 'Salvando...' : 'Salvar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
