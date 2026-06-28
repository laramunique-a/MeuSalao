import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Wallet,
  MoreVertical,
  Undo2,
  Lock,
  Unlock,
  AlertCircle,
  DollarSign,
  User,
  History,
  Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTransacoesByDate, useCaixaSummary, useCaixaAberto, useEstornarTransacao, useSaldoCaixaAberto } from '@/hooks/useCaixa'
import { useAgendamentosEmAtendimento, usePendenciasGlobais } from '@/hooks/useAgendamentos'
import { format, startOfDay, endOfDay, subDays, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { AbrirCaixaDialog } from '@/components/caixa/AbrirCaixaDialog'
import { FecharCaixaDialog } from '@/components/caixa/FecharCaixaDialog'
import { MovimentacaoManualDialog } from '@/components/caixa/MovimentacaoManualDialog'
import { DarBaixaDialog } from '@/components/caixa/DarBaixaDialog'
import { HistoricoCaixa } from '@/components/caixa/HistoricoCaixa'
import { EditarAberturaDialog } from '@/components/caixa/EditarAberturaDialog'
import { DebitosPassadosDialog } from '@/components/caixa/DebitosPassadosDialog'
import type { Agendamento } from '@/types/models'
import { cn } from '@/lib/utils'

export default function Caixa() {
  const { toast } = useToast()
  const { isAdmin, usuario } = useAuthStore()
  const [dataInicio] = useState(startOfDay(new Date()).toISOString())
  const [dataFim] = useState(endOfDay(new Date()).toISOString())
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog States
  const [isAbrirOpen, setIsAbrirOpen] = useState(false)
  const [isFecharOpen, setIsFecharOpen] = useState(false)
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false)
  const [isDarBaixaOpen, setIsDarBaixaOpen] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [activeTab, setActiveTab] = useState<'hoje' | 'historico'>('hoje')
  const [isEditarAberturaOpen, setIsEditarAberturaOpen] = useState(false)
  const [selectedAberturaId, setSelectedAberturaId] = useState<string | null>(null)
  const [selectedAberturaValor, setSelectedAberturaValor] = useState<number>(0)
  const [isDebitosPassadosOpen, setIsDebitosPassadosOpen] = useState(false)

  const { data: transacoes, isLoading: loadingTrans } = useTransacoesByDate(dataInicio, dataFim)
  const { data: resumen } = useCaixaSummary(dataInicio, dataFim)
  const { data: caixaAberto, isLoading: loadingStatus } = useCaixaAberto()
  const { data: saldoRealCaixa = 0 } = useSaldoCaixaAberto(caixaAberto?.id)
  
  // Buscar pendências de até 7 dias atrás
  const [dataPendenciasInicio] = useState(subDays(startOfDay(new Date()), 7).toISOString())
  const { data: pendencias } = useAgendamentosEmAtendimento(dataPendenciasInicio, dataFim)
  const estornar = useEstornarTransacao()

  const { data: pendenciasGlobais = [] } = usePendenciasGlobais()

  const pendenciasPassadas = pendenciasGlobais.filter(p => {
    if (!caixaAberto) return false
    // Compara apenas a DATA (ignorando hora) para não incluir agendamentos
    // do mesmo dia que foram realizados antes do horário de abertura do caixa
    const dataAgendamento = startOfDay(new Date(p.data_hora))
    const dataAberturaCaixa = startOfDay(new Date(caixaAberto.data_abertura))
    return dataAgendamento < dataAberturaCaixa
  })

  // Calcular comissões por profissional (dos agendamentos concluídos no período)
  const comissoesPorProfissional = transacoes?.reduce((acc: any, t) => {
    if (t.status === 'ativo' && t.comissao_valor && t.agendamento?.profissional) {
      const profissional = t.agendamento.profissional
      const profId = profissional.id
      const profNome = profissional.nome
      
      // Se não for admin, mostrar apenas as comissões do próprio usuário
      if (!isAdmin && profId !== usuario?.id) {
        return acc
      }

      if (!acc[profId]) acc[profId] = { nome: profNome, total: 0 }
      acc[profId].total += t.comissao_valor
    }
    return acc
  }, {})

  const totalComissoes = Object.values(comissoesPorProfissional || {}).reduce((acc: number, p: any) => acc + p.total, 0)

  const filteredTransacoes = transacoes?.filter(t => 
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEstorno = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem realizar estornos.',
        variant: 'destructive'
      })
      return
    }

    try {
      await estornar.mutateAsync(id)
      toast({
        title: 'Transação estornada',
        description: 'A movimentação foi marcada como estornada.'
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao estornar',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  if (loadingStatus) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-primary"></div>
      </div>
    )
  }

  const isOldCaixa = caixaAberto && isBefore(startOfDay(parseISO(caixaAberto.data_abertura)), startOfDay(new Date()))

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      {isOldCaixa && (
        <div className="mb-6 p-4 border border-border bg-card rounded-lg flex items-center gap-3 text-foreground">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="text-xs uppercase tracking-wider">
            <p className="font-semibold">Caixa de dia anterior detectado</p>
            <p className="text-muted-foreground mt-0.5">
              Este caixa foi aberto em {format(parseISO(caixaAberto.data_abertura), "dd/MM 'às' HH:mm")}. 
              Recomendamos fechar este caixa antes de processar as vendas de hoje.
            </p>
          </div>
        </div>
      )}
      {caixaAberto && pendenciasPassadas.length > 0 && (
        <div className="mb-6 p-4 border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-600">Débitos de Caixas Anteriores Pendentes</p>
              <p className="text-muted-foreground mt-0.5">
                Existem {pendenciasPassadas.length} {pendenciasPassadas.length === 1 ? 'atendimento' : 'atendimentos'} de dias anteriores pendentes de quitação (Total: R$ {pendenciasPassadas.reduce((acc, p) => acc + Number(p.valor), 0).toFixed(2).replace('.', ',')}).
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs uppercase tracking-wider h-8 text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10 self-start sm:self-center bg-transparent"
            onClick={() => setIsDebitosPassadosOpen(true)}
          >
            Visualizar Débitos
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Caixa</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'hoje' && (caixaAberto ? (
            <>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-3 border-border text-foreground hover:bg-accent rounded-lg"
                  onClick={() => setIsFecharOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Fechar Caixa
                </Button>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  className="h-9 px-3 rounded-lg"
                  onClick={() => {
                    setIsMovimentacaoOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Movimentação
                </Button>
              )}
            </>
          ) : (
            isAdmin && (
              <Button 
                size="sm" 
                className="h-9 px-3 rounded-lg"
                onClick={() => setIsAbrirOpen(true)}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            )
          ))}
        </div>
      </div>

      {/* Tab Navigation + Status Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-card p-3 rounded-lg border border-border">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5">
          <button
            onClick={() => setActiveTab('hoje')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'hoje'
                ? 'bg-accent text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Hoje
            </span>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'historico'
                ? 'bg-accent text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Histórico
            </span>
          </button>
        </div>

        {/* Status Badges — only in Hoje tab */}
        {activeTab === 'hoje' && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={cn("h-7 px-3 text-[10px] font-semibold border rounded-full uppercase tracking-wider", caixaAberto ? 'bg-accent border-border text-foreground' : 'bg-red-500/10 border-border text-red-500')}>
              Status: <span className="ml-1">{caixaAberto ? 'Aberto' : 'Fechado'}</span>
            </Badge>

            {pendencias && pendencias.length > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-border rounded-full uppercase tracking-wider">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {pendencias.length} {pendencias.length === 1 ? 'Pendência' : 'Pendências'}
              </Badge>
            )}
            
            {caixaAberto && (
              <>
                {isAdmin && (
                  <>
                    <Badge variant="secondary" className="h-7 px-3 text-[10px] font-semibold bg-background border border-border text-muted-foreground rounded-full">
                      Entradas: <span className="text-foreground ml-1">R$ {resumen?.entradas.toFixed(2).replace('.', ',')}</span>
                    </Badge>
                    <Badge variant="secondary" className="h-7 px-3 text-[10px] font-semibold bg-background border border-border text-muted-foreground rounded-full">
                      Saídas: <span className="text-foreground ml-1">R$ {resumen?.saidas.toFixed(2).replace('.', ',')}</span>
                    </Badge>
                  </>
                )}
                
                <Badge variant="secondary" className="h-7 px-3 text-[10px] font-semibold bg-background border border-border text-muted-foreground rounded-full">
                  Comissões: <span className="text-foreground ml-1">R$ {totalComissoes.toFixed(2).replace('.', ',')}</span>
                </Badge>

                {isAdmin && (
                  <Badge variant="secondary" className="h-7 px-3 text-[10px] font-semibold bg-primary text-primary-foreground border border-transparent rounded-full">
                    Saldo: <span className="ml-1">R$ {resumen?.saldo.toFixed(2).replace('.', ',')}</span>
                  </Badge>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'historico' ? (
        <HistoricoCaixa />
      ) : (
        <div className="space-y-8">
          {/* Seção de Pendências de Pagamento - Sempre visível se houver algo a receber */}
          {pendencias && pendencias.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-accent rounded-lg border border-border">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Pendente de Pagamento</h3>
                <Badge variant="outline" className="bg-accent/50 text-foreground border-border text-[10px] font-bold">
                  {pendencias.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendencias
                  .filter(ag => isAdmin || ag.profissional_id === useAuthStore.getState().usuario?.id)
                  .map((ag) => (
                  <Card key={ag.id} className="border-border bg-card shadow-none">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-xs text-foreground uppercase tracking-wider">{ag.cliente?.nome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ag.servico?.nome}</p>
                        </div>
                        <p className="font-bold text-sm text-foreground">R$ {ag.valor.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <User className="h-3.5 w-3.5" />
                          {ag.profissional?.nome}
                        </div>
                        <Button 
                          size="sm" 
                          className="h-8 px-4 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
                          disabled={!caixaAberto}
                          onClick={() => {
                            setSelectedAgendamento(ag)
                            setIsDarBaixaOpen(true)
                          }}
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1" />
                          {caixaAberto ? 'Receber' : 'Caixa Fechado'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!caixaAberto ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-dashed border-border">
              <Wallet className="h-10 w-10 text-muted-foreground opacity-40 mb-4" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">O caixa está fechado</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                {isAdmin
                  ? 'Inicie o caixa no botão superior para registrar movimentações.'
                  : 'Solicite ao administrador a abertura do caixa para registrar movimentações.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Sidebar de Comissões movida para cima para dar largura 100% à tabela */}
              <div className="w-full space-y-4">
                <Card className="rounded-lg border border-border overflow-hidden bg-card">
                  <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h4 className="font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Comissões de Hoje
                    </h4>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lançadas automaticamente.</span>
                  </div>
                  <CardContent className="p-4">
                    {Object.keys(comissoesPorProfissional || {}).length === 0 ? (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-center py-4">
                        Aguardando finalizações...
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.values(comissoesPorProfissional as any).map((prof: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate mr-2">{prof.nome}</span>
                            <Badge variant="outline" className="font-semibold text-[10px] bg-accent border-border text-foreground whitespace-nowrap">
                              R$ {prof.total.toFixed(2).replace('.', ',')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Extrato de Transações */}
              <div className="w-full space-y-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 h-9 rounded-lg border-border bg-background text-xs"
                        placeholder="Pesquisar movimentação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <History className="h-3.5 w-3.5" />
                      Últimas Movimentações
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-muted-foreground font-bold text-[9px] uppercase bg-accent/20 border-b border-border">
                          <th className="px-4 py-3">Horário</th>
                          <th className="px-4 py-3">Descrição</th>
                          <th className="px-4 py-3 text-center">Operador</th>
                          <th className="px-4 py-3">Categoria</th>
                          <th className="px-4 py-3 hidden md:table-cell">Forma</th>
                          <th className="px-4 py-3 text-right">Valor</th>
                          <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                          <th className="px-2 py-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loadingTrans ? (
                          <tr><td colSpan={8} className="p-8 text-center text-xs text-muted-foreground uppercase tracking-wider">Carregando transações...</td></tr>
                        ) : filteredTransacoes?.length === 0 ? (
                          <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-xs uppercase tracking-wider">Nenhuma movimentação encontrada.</td></tr>
                        ) : (
                          filteredTransacoes?.map((t) => (
                            <tr key={t.id} className={`hover:bg-accent/10 transition-colors ${t.status !== 'ativo' ? 'opacity-40 grayscale' : ''}`}>
                              <td className="px-4 py-3.5 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                                {format(new Date(t.data_hora), 'HH:mm')}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-xs">
                                <span className="line-clamp-2 text-foreground font-semibold uppercase tracking-wider">{t.descricao}</span>
                                {t.agendamento && <span className="block text-[8px] text-muted-foreground font-bold uppercase mt-0.5">Automático</span>}
                              </td>
                              <td className="px-4 py-3.5 text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-wider">
                                <span className="line-clamp-2">{t.agendamento?.profissional?.nome || t.usuario?.nome || '—'}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge variant="outline" className="text-[8px] font-bold rounded-lg px-2 h-5 border-border uppercase bg-background text-muted-foreground leading-tight">
                                  {t.categoria || 'Geral'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 capitalize text-[10px] text-muted-foreground hidden md:table-cell uppercase tracking-wider">
                                {t.forma_pagamento.replace('_', ' ')}
                              </td>
                              <td className={`px-4 py-3.5 text-right font-bold text-xs whitespace-nowrap ${t.tipo === 'entrada' ? 'text-foreground' : 'text-red-500'}`}>
                                {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="px-4 py-3.5 hidden sm:table-cell whitespace-nowrap">
                                {t.status === 'ativo' ? (
                                  <Badge className="bg-accent border border-border text-foreground hover:bg-accent rounded-full text-[8px] font-semibold px-2 h-5 uppercase tracking-wider">Ativo</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-border bg-red-500/10 rounded-full text-[8px] font-semibold px-2 h-5 uppercase tracking-wider capitalize truncate">{t.status}</Badge>
                                )}
                              </td>
                              <td className="px-2 py-3.5 text-right">
                                {t.status === 'ativo' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-accent">
                                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-lg border-border">
                                      {isAdmin && (
                                        t.categoria === 'Abertura de Caixa' ? (
                                          <DropdownMenuItem 
                                            className="cursor-pointer gap-2 font-semibold text-xs uppercase tracking-wider text-foreground focus:text-foreground"
                                            onClick={() => {
                                              setSelectedAberturaId(t.id)
                                              setSelectedAberturaValor(t.valor)
                                              setIsEditarAberturaOpen(true)
                                            }}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Editar Saldo
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem 
                                            className="text-red-500 focus:text-red-500 cursor-pointer gap-2 font-semibold text-xs uppercase tracking-wider"
                                            onClick={() => handleEstorno(t.id)}
                                          >
                                            <Undo2 className="h-3.5 w-3.5" />
                                            Estornar
                                          </DropdownMenuItem>
                                        )
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AbrirCaixaDialog open={isAbrirOpen} onOpenChange={setIsAbrirOpen} />
      <FecharCaixaDialog 
        open={isFecharOpen && !!caixaAberto} 
        onOpenChange={setIsFecharOpen} 
        caixaId={caixaAberto?.id || ''} 
        saldoSistema={saldoRealCaixa}
        dataAbertura={caixaAberto?.data_abertura}
        pendencias={pendencias}
      />
      <MovimentacaoManualDialog 
        open={isMovimentacaoOpen} 
        onOpenChange={setIsMovimentacaoOpen} 
      />
      <DarBaixaDialog
        open={isDarBaixaOpen}
        onOpenChange={setIsDarBaixaOpen}
        agendamento={selectedAgendamento}
      />
      <EditarAberturaDialog
        open={isEditarAberturaOpen}
        onOpenChange={setIsEditarAberturaOpen}
        transacaoId={selectedAberturaId}
        valorAtual={selectedAberturaValor}
      />
      <DebitosPassadosDialog
        open={isDebitosPassadosOpen}
        onOpenChange={setIsDebitosPassadosOpen}
        pendencias={pendenciasPassadas}
        onReceber={(ag) => {
          setSelectedAgendamento(ag)
          setIsDarBaixaOpen(true)
        }}
      />
    </div>
  )
}
