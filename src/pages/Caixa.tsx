import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useTransacoesByDate, useDeleteTransacao, useCaixaSummary } from '@/hooks/useCaixa'
import { useAgendamentosEmAtendimento, useHasPendencias } from '@/hooks/useAgendamentos'
import { TransacaoFormDialog } from '@/components/caixa/TransacaoFormDialog'
import { DarBaixaDialog } from '@/components/caixa/DarBaixaDialog'
import type { TransacaoCaixa, Agendamento } from '@/types/models'
import { useToast } from '@/hooks/use-toast'
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FORMAS_PAGAMENTO_LABELS } from '@/lib/constants'

export default function Caixa() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDarBaixaOpen, setIsDarBaixaOpen] = useState(false)
  const [agendamentoParaBaixa, setAgendamentoParaBaixa] = useState<Agendamento | null>(null)

  const startDate = format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss")
  const endDate = format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss")

  const { data: transacoes = [], isLoading } = useTransacoesByDate(startDate, endDate)
  const { data: summary } = useCaixaSummary(startDate, endDate)
  const { data: agendamentosEmAtendimento = [] } = useAgendamentosEmAtendimento(startDate, endDate)
  const { data: temPendenciasGlobais = false } = useHasPendencias()
  const deleteTransacao = useDeleteTransacao()

  function handleDarBaixa(agendamento: Agendamento) {
    setAgendamentoParaBaixa(agendamento)
    setIsDarBaixaOpen(true)
  }

  function handlePreviousDay() {
    setSelectedDate((prev) => subDays(prev, 1))
  }

  function handleNextDay() {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  function handleToday() {
    setSelectedDate(new Date())
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle financeiro do salão
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={handlePreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={isToday ? 'default' : 'outline'}
          onClick={handleToday}
          className="min-w-[120px]"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Hoje
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-4 font-medium">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-none bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Entradas</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              R$ {summary?.entradas.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-rose-50/50 dark:bg-rose-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">Saídas</CardTitle>
            <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              R$ {summary?.saidas.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">Saldo</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className={`text-2xl font-bold ${(summary?.saldo || 0) >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'}`}>
              R$ {summary?.saldo.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando transações...</div>
      ) : (
        <>
          {/* Seção: Aviso de Pendências Globais (se não estiver vendo o dia de hoje) */}
          {!isToday && temPendenciasGlobais && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-800 dark:text-red-200">
              <ClipboardCheck className="h-5 w-5" />
              <span className="font-semibold">Existe pendência(s) de caixa</span>
              <Button
                variant="link"
                className="text-red-800 dark:text-red-200 hover:text-red-900 p-0 h-auto font-bold ml-auto"
                onClick={handleToday}
              >
                Ver
              </Button>
            </div>
          )}

          {/* Seção: Pendentes de Baixa (Apenas se houver no dia selecionado E for o dia de hoje) */}
          {agendamentosEmAtendimento.length > 0 && isToday && (
            <Card className="mb-6 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <ClipboardCheck className="h-5 w-5" />
                  Pendentes de Baixa ({agendamentosEmAtendimento.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agendamentosEmAtendimento.map((ag) => (
                    <div
                      key={ag.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{ag.cliente?.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ag.servico?.nome} &bull; {ag.profissional?.nome} &bull;{' '}
                          {format(new Date(ag.data_hora), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">
                          R$ {ag.valor.toFixed(2).replace('.', ',')}
                        </span>
                        <Button size="sm" onClick={() => handleDarBaixa(ag)}>
                          Dar Baixa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de transações */}
          {transacoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhuma transação encontrada neste dia
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2 h-10">Hora</TableHead>
                    <TableHead className="py-2 h-10">Tipo</TableHead>
                    <TableHead className="py-2 h-10">Descrição</TableHead>
                    <TableHead className="py-2 h-10">Pagamento</TableHead>
                    <TableHead className="py-2 h-10">Categoria</TableHead>
                    <TableHead className="text-right py-2 h-10">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((transacao) => (
                    <TableRow key={transacao.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium py-2 text-xs">
                        {format(new Date(transacao.data_hora), 'HH:mm')}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={transacao.tipo === 'entrada' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs">{transacao.descricao}</TableCell>
                      <TableCell className="py-2 text-xs">{FORMAS_PAGAMENTO_LABELS[transacao.forma_pagamento]}</TableCell>
                      <TableCell className="py-2 text-xs">{transacao.categoria || '-'}</TableCell>
                      <TableCell className={`text-right font-bold py-2 text-sm ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipo === 'entrada' ? '+' : '-'} R$ {transacao.valor.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <TransacaoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

      <DarBaixaDialog
        open={isDarBaixaOpen}
        onOpenChange={setIsDarBaixaOpen}
        agendamento={agendamentoParaBaixa}
      />
    </div>
  )
}
