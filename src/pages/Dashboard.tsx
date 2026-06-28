import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgendamentosByDate } from '@/hooks/useAgendamentos'
import { useCaixaSummary } from '@/hooks/useCaixa'
import { useClientes } from '@/hooks/useClientes'
import { Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const hoje = new Date()
  // toISOString() inclui o offset UTC corretamente (ex: UTC-3 → intervalo até 02:00 UTC do dia seguinte)
  const inicioHoje = startOfDay(hoje).toISOString()
  const fimHoje = endOfDay(hoje).toISOString()

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
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          Visão geral do salão — {format(hoje, "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-medium tracking-tight text-foreground">{agendamentosHoje.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              {agendamentosConcluidos} concluídos, {agendamentosPendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receita do Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-medium tracking-tight text-foreground">
              R$ {summaryHoje?.entradas.toFixed(2) || '0.00'}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Saldo: R$ {summaryHoje?.saldo.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Novos Clientes (Mês)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-medium tracking-tight text-foreground">{clientesEsteMes}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              Total: {clientes.length} clientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-medium tracking-tight text-foreground">
              {agendamentosHoje.length > 0
                ? Math.round((agendamentosConcluidos / agendamentosHoje.length) * 100)
                : 0}
              %
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              {agendamentosConcluidos} de {agendamentosHoje.length} atendimentos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardHeader className="py-4 px-5">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {proximosAgendamentos.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-xs uppercase tracking-wider">
                Nenhum agendamento pendente hoje
              </p>
            ) : (
              <div className="space-y-4">
                {proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{agendamento.cliente?.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {agendamento.servico?.nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">
                        {format(new Date(agendamento.data_hora), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        R$ {agendamento.valor.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="py-4 px-5">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Entradas do dia</span>
                <span className="text-sm font-medium text-foreground">
                  R$ {summaryHoje?.entradas.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Saídas do dia</span>
                <span className="text-sm font-medium text-foreground">
                  R$ {summaryHoje?.saidas.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-widest">Saldo do dia</span>
                <span className="text-sm font-bold text-foreground">
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
