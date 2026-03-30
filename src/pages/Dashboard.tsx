import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgendamentosByDate } from '@/hooks/useAgendamentos'
import { useCaixaSummary } from '@/hooks/useCaixa'
import { useClientes } from '@/hooks/useClientes'
import { Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const hoje = new Date()
  const inicioHoje = format(startOfDay(hoje), "yyyy-MM-dd'T'HH:mm:ss")
  const fimHoje = format(endOfDay(hoje), "yyyy-MM-dd'T'HH:mm:ss")


  const { data: agendamentosHoje = [] } = useAgendamentosByDate(inicioHoje, fimHoje)
  const { data: summaryHoje } = useCaixaSummary(inicioHoje, fimHoje)
  const { data: clientes = [] } = useClientes()

  const agendamentosConcluidos = agendamentosHoje.filter((a) => a.status === 'concluido').length
  const agendamentosPendentes = agendamentosHoje.filter((a) =>
    ['agendado', 'confirmado', 'em_atendimento', 'em_atraso'].includes(a.status)
  ).length

  const proximosAgendamentos = agendamentosHoje
    .filter((a) =>
      ['agendado', 'confirmado', 'em_atendimento', 'em_atraso'].includes(a.status)
    )
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
    .slice(0, 5)

  const clientesEsteMes = clientes.filter(
    (c) => new Date(c.created_at) >= startOfMonth(hoje)
  ).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral do salão - {format(hoje, "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Agendamentos Hoje</CardTitle>
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentosHoje.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {agendamentosConcluidos} concluídos, {agendamentosPendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Receita do Dia</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summaryHoje?.entradas.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Saldo: R$ {summaryHoje?.saldo.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Novos Clientes (Mês)</CardTitle>
            <Users className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesEsteMes}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Total: {clientes.length} clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agendamentosHoje.length > 0
                ? Math.round((agendamentosConcluidos / agendamentosHoje.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {agendamentosConcluidos} de {agendamentosHoje.length} atendimentos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="py-4 px-5">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Clock className="h-4 w-4 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {proximosAgendamentos.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Nenhum agendamento pendente hoje
              </p>
            ) : (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-bold text-sm">{agendamento.cliente?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {agendamento.servico?.nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {format(new Date(agendamento.data_hora), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {agendamento.valor.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Entradas do dia</span>
                <span className="font-semibold text-green-600">
                  R$ {summaryHoje?.entradas.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Saídas do dia</span>
                <span className="font-semibold text-red-600">
                  R$ {summaryHoje?.saidas.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Saldo do dia</span>
                <span
                  className={`font-bold text-lg ${(summaryHoje?.saldo || 0) >= 0 ? 'text-primary' : 'text-red-600'
                    }`}
                >
                  R$ {summaryHoje?.saldo.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
