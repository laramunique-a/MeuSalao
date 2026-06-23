import { useState } from 'react'
import { useClientes } from '@/hooks/useClientes'
import { useClienteReport, useCaixaPendenciasReport, useFolhaPagamentoReport } from '@/hooks/useRelatorios'
import { useProfissionais } from '@/hooks/useProfissionais'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Check,
  ChevronsUpDown,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const getAgendamentoStatusLabel = (status: string) => {
  switch (status) {
    case 'agendado': return 'Agendado'
    case 'confirmado': return 'Confirmado'
    case 'em_atendimento': return 'Em Atendimento'
    case 'em_atraso': return 'Em Atraso'
    case 'pendente_caixa': return 'Pendente Caixa'
    case 'concluido': return 'Concluído'
    case 'cancelado': return 'Cancelado'
    default: return status
  }
}

const getAgendamentoStatusStyles = (status: string) => {
  switch (status) {
    case 'cancelado':
      return 'border-border text-red-500 bg-red-500/10 dark:bg-red-500/20'
    case 'pendente_caixa':
      return 'border-red-500/20 text-red-500 bg-red-500/10 dark:bg-red-500/20 font-bold'
    case 'em_atraso':
      return 'border-border text-amber-600 bg-amber-500/10 dark:bg-amber-500/20'
    case 'concluido':
      return 'border-border text-muted-foreground bg-accent'
    default:
      return 'border-border text-foreground bg-accent/50'
  }
}

export default function Relatorios() {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [search, setSearch] = useState('')
  const [activeReportTab, setActiveReportTab] = useState<'cliente' | 'caixa' | 'folha'>('cliente')
  const [selectedProfissionalIdForFolha, setSelectedProfissionalIdForFolha] = useState<string>('all')

  const { data: clientes = [] } = useClientes()
  const { data: reportData, isLoading: loadingReport } = useClienteReport(selectedClienteId)
  const { data: caixaReport = [], isLoading: loadingCaixaReport } = useCaixaPendenciasReport()
  const { data: folhaData = [], isLoading: loadingFolha } = useFolhaPagamentoReport()
  const { data: profissionais = [] } = useProfissionais()

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId)

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefone && c.telefone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  // Calcular KPIs do Relatório por Cliente
  const agendamentos = reportData?.agendamentos || []
  const transacoes = reportData?.transacoes || []

  const atendimentosConcluidos = agendamentos.filter((a) => a.status === 'concluido')
  const totalAtendimentosValidos = agendamentos.filter((a) => a.status !== 'cancelado').length
  const hasUnpaidDebt = agendamentos.some((a) => a.status === 'pendente_caixa')

  const totalPago = transacoes
    .filter((t) => t.tipo === 'entrada' && t.status === 'ativo')
    .reduce((acc, t) => acc + Number(t.valor), 0)

  const ticketMedio = atendimentosConcluidos.length > 0
    ? totalPago / atendimentosConcluidos.length
    : 0

  const ultimoAtendimento = agendamentos.length > 0 ? agendamentos[0] : null

  // Filtrar dados da folha de pagamento pelo profissional selecionado
  const filteredFolhaData = folhaData.filter((item: any) => {
    if (selectedProfissionalIdForFolha === 'all') return true
    return item.metadata?.profissional_id === selectedProfissionalIdForFolha
  })

  const totalPagoFolha = filteredFolhaData
    .filter((t: any) => t.status === 'ativo')
    .reduce((acc: number, t: any) => acc + Number(t.valor), 0)

  // Achar a forma de pagamento predominante (PIX ou Dinheiro)
  const counts = filteredFolhaData.reduce((acc: any, t: any) => {
    if (t.status === 'ativo') {
      acc[t.forma_pagamento] = (acc[t.forma_pagamento] || 0) + 1
    }
    return acc
  }, {} as any)
  const predominantPaymentMethod = counts.pix > (counts.dinheiro || 0) ? 'PIX' : (counts.dinheiro > 0 ? 'Dinheiro' : 'Nenhuma')

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium tracking-tight">Relatórios</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          Análise e Histórico de Desempenho
        </p>
      </div>

      {/* Report Types Selector (Modo Premium) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-card p-1 rounded-lg border border-border w-fit">
        <button
          onClick={() => setActiveReportTab('cliente')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
            activeReportTab === 'cliente'
              ? 'bg-accent text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Histórico do Cliente
        </button>
        <button
          onClick={() => setActiveReportTab('caixa')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
            activeReportTab === 'caixa'
              ? 'bg-accent text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Pendências por Caixa
        </button>
        <button
          onClick={() => setActiveReportTab('folha')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
            activeReportTab === 'folha'
              ? 'bg-accent text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Folha de Pagamento
        </button>
      </div>

      {/* RENDER - Relatório de Cliente */}
      {activeReportTab === 'cliente' && (
        <div className="space-y-6">
          {/* Main Filter Section */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                Pesquisar Cliente
              </label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full sm:w-[350px] justify-between h-10 px-3 text-xs border-border bg-background hover:bg-accent text-left rounded-lg shadow-none font-normal"
                  >
                    <span className="truncate">
                      {selectedCliente ? selectedCliente.nome : 'Selecione um cliente para o relatório...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] sm:w-[350px] p-0 border-border bg-background rounded-lg shadow-md" align="start">
                  <Command className="bg-background">
                    <CommandInput
                      placeholder="Pesquisar por nome, tel ou email..."
                      value={search}
                      onValueChange={setSearch}
                      className="text-xs h-9 border-none bg-background focus:ring-0 focus:outline-none"
                    />
                    <CommandList className="max-h-[250px] overflow-y-auto">
                      <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
                        Nenhum cliente encontrado.
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredClientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.nome}
                            onSelect={() => {
                              setSelectedClienteId(c.id)
                              setOpenCombobox(false)
                              setSearch('')
                            }}
                            className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground px-3 py-2 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Check
                                className={cn(
                                  'h-3.5 w-3.5 text-foreground',
                                  selectedClienteId === c.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="font-semibold text-foreground">{c.nome}</span>
                            </div>
                            {c.telefone && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {c.telefone}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedCliente && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-muted-foreground sm:ml-auto pt-2 sm:pt-0">
                {selectedCliente.telefone && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Tel:</span> {selectedCliente.telefone}
                  </div>
                )}
                {selectedCliente.email && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Email:</span> {selectedCliente.email}
                  </div>
                )}
              </div>
            )}
          </div>

          {!selectedClienteId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-dashed border-border">
              <Search className="h-10 w-10 text-muted-foreground opacity-40 mb-4" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Nenhum Cliente Selecionado</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um cliente no filtro acima para visualizar o histórico de atendimentos e pagamentos.
              </p>
            </div>
          ) : loadingReport ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Carregando relatório do cliente...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alerta de Status Financeiro */}
              {hasUnpaidDebt ? (
                <div className="p-4 border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 rounded-lg flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <div className="text-xs uppercase tracking-wider">
                    <p className="font-bold">Cliente Inadimplente (Possui Débitos em Aberto)</p>
                    <p className="text-muted-foreground mt-0.5">
                      Este cliente possui atendimentos com status pendente de pagamento no caixa.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-green-500/20 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center gap-3 text-green-600">
                  <Check className="h-5 w-5 shrink-0 text-green-600" />
                  <div className="text-xs uppercase tracking-wider">
                    <p className="font-bold">Situação Regular</p>
                    <p className="text-muted-foreground mt-0.5">
                      Nenhum débito em aberto ou pendência registrado para este cliente.
                    </p>
                  </div>
                </div>
              )}

              {/* KPI Dashboard Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border bg-card shadow-none rounded-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/50 border border-border">
                      <DollarSign className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Pago</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(totalPago)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-none rounded-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/50 border border-border">
                      <Calendar className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Atendimentos</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{totalAtendimentosValidos} agendados</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-none rounded-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/50 border border-border">
                      <TrendingUp className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ticket Médio</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(ticketMedio)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-none rounded-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/50 border border-border">
                      <Clock className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="truncate">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Último Atendimento</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                        {ultimoAtendimento
                          ? format(new Date(ultimoAtendimento.data_hora), 'dd/MM/yyyy')
                          : 'Nenhum'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tables and Tabs */}
              <Card className="border-border bg-card shadow-none rounded-lg overflow-hidden">
                <Tabs defaultValue="atendimentos" className="w-full">
                  <div className="border-b border-border bg-card/50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <TabsList className="bg-background border border-border p-0.5 rounded-lg h-9">
                      <TabsTrigger
                        value="atendimentos"
                        className="text-xs font-semibold uppercase tracking-wider h-8 rounded-md data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold shadow-none"
                      >
                        Atendimentos
                      </TabsTrigger>
                      <TabsTrigger
                        value="pagamentos"
                        className="text-xs font-semibold uppercase tracking-wider h-8 rounded-md data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold shadow-none"
                      >
                        Pagamentos
                      </TabsTrigger>
                    </TabsList>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Histórico completo do cliente
                    </span>
                  </div>

                  <TabsContent value="atendimentos" className="mt-0 outline-none">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground font-bold text-[9px] uppercase bg-accent/20 border-b border-border">
                            <th className="px-4 py-3">Data / Horário</th>
                            <th className="px-4 py-3">Serviço</th>
                            <th className="px-4 py-3">Profissional</th>
                            <th className="px-4 py-3 text-right">Valor</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {agendamentos.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-wider">
                                Nenhum atendimento registrado.
                              </td>
                            </tr>
                          ) : (
                            agendamentos.map((ag) => (
                              <tr
                                key={ag.id}
                                className={cn(
                                  "hover:bg-accent/10 transition-colors",
                                  ag.status === 'cancelado' && 'opacity-40 grayscale'
                                )}
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                                  {format(new Date(ag.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                                </td>
                                <td className="px-4 py-3 font-semibold text-foreground uppercase tracking-wider">
                                  {ag.servico?.nome || '—'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider">
                                  {ag.profissional?.nome || '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                                  {formatCurrency(ag.valor)}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <Badge
                                    className={cn(
                                      "rounded-full text-[8px] font-semibold px-2 h-5 border uppercase tracking-wider shadow-none bg-transparent hover:bg-transparent",
                                      getAgendamentoStatusStyles(ag.status)
                                    )}
                                  >
                                    {getAgendamentoStatusLabel(ag.status)}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="pagamentos" className="mt-0 outline-none">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground font-bold text-[9px] uppercase bg-accent/20 border-b border-border">
                            <th className="px-4 py-3">Data / Horário</th>
                            <th className="px-4 py-3">Descrição / Venda</th>
                            <th className="px-4 py-3">Forma de Pagamento</th>
                            <th className="px-4 py-3 text-right">Valor Recebido</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transacoes.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-wider">
                                Nenhum pagamento registrado.
                              </td>
                            </tr>
                          ) : (
                            transacoes.map((t) => (
                              <tr
                                key={t.id}
                                className={cn(
                                  "hover:bg-accent/10 transition-colors",
                                  t.status !== 'ativo' && 'opacity-40 grayscale'
                                )}
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                                  {format(new Date(t.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                                </td>
                                <td className="px-4 py-3 font-semibold text-foreground uppercase tracking-wider">
                                  <span className="block">{t.descricao}</span>
                                  {t.agendamento?.servico?.nome && (
                                    <span className="block text-[8px] text-muted-foreground font-bold uppercase mt-0.5">
                                      Serviço: {t.agendamento.servico.nome}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground capitalize font-semibold uppercase tracking-wider">
                                  {t.forma_pagamento.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                                  {formatCurrency(t.valor)}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  {t.status === 'ativo' ? (
                                    <Badge className="bg-accent border border-border text-foreground hover:bg-accent rounded-full text-[8px] font-semibold px-2 h-5 uppercase tracking-wider shadow-none">
                                      Confirmado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-500 border-border bg-red-500/10 rounded-full text-[8px] font-semibold px-2 h-5 uppercase tracking-wider capitalize truncate shadow-none">
                                      {t.status}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* RENDER - Relatório de Caixa (Pendências) */}
      {activeReportTab === 'caixa' && (
        <div className="space-y-6">
          <div className="p-4 bg-card rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Relatório de Caixa (Pendências Financeiras)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monitore os débitos gerados por sessão de caixa e acompanhe se/onde foram quitados.</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-lg font-semibold text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Pendentes: {caixaReport.filter((r) => r.status === 'pendente').length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-lg font-semibold text-green-600">
                <Check className="h-4 w-4" />
                <span>Quitados: {caixaReport.filter((r) => r.status === 'quitado').length}</span>
              </div>
            </div>
          </div>

          <Card className="border-border bg-card shadow-none rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-muted-foreground font-bold text-[9px] uppercase bg-accent/20 border-b border-border">
                    <th className="px-4 py-3">Data Atendimento</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Serviço / Profissional</th>
                    <th className="px-4 py-3">Caixa Origem (Gerado)</th>
                    <th className="px-4 py-3">Caixa Quitação (Pago)</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingCaixaReport ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground uppercase tracking-wider">
                        Carregando relatório de pendências...
                      </td>
                    </tr>
                  ) : caixaReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground uppercase tracking-wider">
                        Nenhuma pendência financeira encontrada.
                      </td>
                    </tr>
                  ) : (
                    caixaReport.map((item) => (
                      <tr key={item.id} className={cn("hover:bg-accent/10 transition-colors", item.status === 'pendente' && 'bg-red-500/[0.01]')}>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                          {format(new Date(item.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-foreground uppercase tracking-wider">
                          {item.cliente}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <span className="block font-semibold text-foreground uppercase tracking-wider">{item.servico}</span>
                          <span className="block text-[9px] uppercase tracking-wider mt-0.5">Por: {item.profissional}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-[10px]">
                          {item.caixa_origem ? (
                            <>
                              <span className="block font-semibold text-foreground">Caixa #{item.caixa_origem.id.slice(0, 6).toUpperCase()}</span>
                              <span className="block text-[8px] uppercase mt-0.5">Aberto: {format(new Date(item.caixa_origem.data_abertura), 'dd/MM/yyyy')}</span>
                            </>
                          ) : (
                            <span className="text-red-500 font-semibold uppercase">Fora de Sessão</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-[10px]">
                          {item.caixa_quitacao ? (
                            <>
                              <span className="block font-semibold text-green-600">Caixa #{item.caixa_quitacao.id.slice(0, 6).toUpperCase()}</span>
                              <span className="block text-[8px] uppercase mt-0.5">Pago: {format(new Date(item.caixa_quitacao.data_abertura), 'dd/MM/yyyy')}</span>
                            </>
                          ) : (
                            <span className="text-red-500 font-semibold uppercase">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(item.valor)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {item.status === 'pendente' ? (
                            <Badge className="border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-500 hover:bg-red-500/10 rounded-full text-[8px] font-bold px-2 h-5 uppercase tracking-wider shadow-none">
                              Pendente
                            </Badge>
                          ) : (
                            <Badge className="border-green-500/20 bg-green-500/10 dark:bg-green-500/20 text-green-600 hover:bg-green-500/10 rounded-full text-[8px] font-bold px-2 h-5 uppercase tracking-wider shadow-none">
                              Quitada
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* RENDER - Relatório de Folha de Pagamento */}
      {activeReportTab === 'folha' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Filter Section */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Folha de Pagamento</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Histórico de comissões pagas manualmente para os profissionais do salão.</p>
            </div>

            {/* Filter by Professional */}
            <div className="flex flex-col gap-1 w-full sm:w-60">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filtrar Profissional</label>
              <Select value={selectedProfissionalIdForFolha} onValueChange={setSelectedProfissionalIdForFolha}>
                <SelectTrigger className="h-9 text-xs rounded-lg border-border bg-background">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border bg-card shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pago (Comissões)</p>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    {formatCurrency(totalPagoFolha)}
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lançamentos</p>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    {filteredFolhaData.length}
                  </h3>
                </div>
                <div className="p-2.5 bg-accent rounded-lg border border-border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Forma Predominante</p>
                  <h3 className="text-sm font-bold mt-2.5 text-foreground uppercase tracking-wider">
                    {predominantPaymentMethod}
                  </h3>
                </div>
                <div className="p-2.5 bg-accent rounded-lg border border-border">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="border-border bg-card shadow-none rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-muted-foreground font-bold text-[9px] uppercase bg-accent/20 border-b border-border">
                    <th className="px-4 py-3">Data Lançamento</th>
                    <th className="px-4 py-3">Profissional</th>
                    <th className="px-4 py-3 text-center">Forma</th>
                    <th className="px-4 py-3">Operador</th>
                    <th className="px-4 py-3">Descrição / Observações</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingFolha ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground uppercase tracking-wider">
                        Carregando folha de pagamento...
                      </td>
                    </tr>
                  ) : filteredFolhaData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground uppercase tracking-wider">
                        Nenhum pagamento registrado.
                      </td>
                    </tr>
                  ) : (
                    filteredFolhaData.map((item) => {
                      const profNome = item.metadata?.profissional_nome || item.descricao.replace('Comissão: ', '').split(' - ')[0] || 'Profissional'
                      return (
                        <tr key={item.id} className={cn("hover:bg-accent/10 transition-colors", item.status !== 'ativo' && 'opacity-40 grayscale')}>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                            {format(new Date(item.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-foreground uppercase tracking-wider">
                            {profNome}
                          </td>
                          <td className="px-4 py-3.5 capitalize text-muted-foreground font-semibold uppercase tracking-wider text-center text-[10px]">
                            {item.forma_pagamento}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground text-[10px] uppercase font-semibold">
                            {item.usuario?.nome || 'Administrador'}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground truncate max-w-[200px]" title={item.descricao}>
                            {item.descricao}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-foreground whitespace-nowrap">
                            {formatCurrency(item.valor)}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {item.status === 'ativo' ? (
                              <Badge className="border-green-500/20 bg-green-500/10 dark:bg-green-500/20 text-green-600 hover:bg-green-500/10 rounded-full text-[8px] font-bold px-2 h-5 uppercase tracking-wider shadow-none">
                                Pago
                              </Badge>
                            ) : (
                              <Badge className="border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-500 hover:bg-red-500/10 rounded-full text-[8px] font-bold px-2 h-5 uppercase tracking-wider shadow-none">
                                Estornado
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
