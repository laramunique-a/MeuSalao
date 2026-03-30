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
  History
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
import { useTransacoesByDate, useCaixaSummary, useCaixaAberto, useEstornarTransacao } from '@/hooks/useCaixa'
import { useAgendamentosEmAtendimento } from '@/hooks/useAgendamentos'
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
import type { Agendamento } from '@/types/models'

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

  const { data: transacoes, isLoading: loadingTrans } = useTransacoesByDate(dataInicio, dataFim)
  const { data: resumen } = useCaixaSummary(dataInicio, dataFim)
  const { data: caixaAberto, isLoading: loadingStatus } = useCaixaAberto()
  
  // Buscar pendências de até 7 dias atrás
  const [dataPendenciasInicio] = useState(subDays(startOfDay(new Date()), 7).toISOString())
  const { data: pendencias } = useAgendamentosEmAtendimento(dataPendenciasInicio, dataFim)
  const estornar = useEstornarTransacao()

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isOldCaixa = caixaAberto && isBefore(startOfDay(parseISO(caixaAberto.data_abertura)), startOfDay(new Date()))

  return (
    <div className="px-6 py-4">
      {isOldCaixa && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Caixa de dia anterior detectado</p>
            <p className="text-rose-700/80">
              Este caixa foi aberto em {format(parseISO(caixaAberto.data_abertura), "dd/MM 'às' HH:mm")}. 
              Recomendamos fechar este caixa antes de processar as vendas de hoje.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground text-[11px] font-medium flex items-center gap-2 mt-0.5">
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
                  className="h-9 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-medium text-sm shadow-sm"
                  onClick={() => setIsFecharOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  className="h-9 px-3 shadow-md rounded-lg font-medium text-sm"
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
                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-md rounded-lg font-medium text-sm"
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm transition-all duration-300">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('hoje')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hoje'
                ? 'bg-background shadow-sm text-primary'
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
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'historico'
                ? 'bg-background shadow-sm text-primary'
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
            <Badge variant="secondary" className={`h-7 px-3 text-[11px] font-bold border border-border/50 rounded-full shadow-sm ${caixaAberto ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              Status: <span className="ml-1 uppercase">{caixaAberto ? 'Aberto' : 'Fechado'}</span>
            </Badge>

            {pendencias && pendencias.length > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                {pendencias.length} {pendencias.length === 1 ? 'Pendência' : 'Pendências'}
              </Badge>
            )}
            
            {caixaAberto && (
              <>
                {isAdmin && (
                  <>
                    <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
                      Entradas: <span className="text-emerald-600 ml-1">R$ {resumen?.entradas.toFixed(2).replace('.', ',')}</span>
                    </Badge>
                    <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
                      Saídas: <span className="text-rose-600 ml-1">R$ {resumen?.saidas.toFixed(2).replace('.', ',')}</span>
                    </Badge>
                  </>
                )}
                
                <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
                  Comissões: <span className="text-blue-600 ml-1">R$ {totalComissoes.toFixed(2).replace('.', ',')}</span>
                </Badge>

                {isAdmin && (
                  <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full shadow-sm">
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
        <div className="space-y-6">
          {/* Seção de Pendências de Pagamento - Sempre visível se houver algo a receber */}
          {pendencias && pendencias.length > 0 && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pendente de Pagamento</h3>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {pendencias.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendencias
                  .filter(ag => isAdmin || ag.profissional_id === useAuthStore.getState().usuario?.id)
                  .map((ag) => (
                  <Card key={ag.id} className="border-amber-100 bg-amber-50/20 hover:bg-amber-50/40 transition-colors shadow-none">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{ag.cliente?.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{ag.servico?.nome}</p>
                        </div>
                        <p className="font-bold text-emerald-600">R$ {ag.valor.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                          <User className="h-3 w-3" />
                          {ag.profissional?.nome}
                        </div>
                        <Button 
                          size="sm" 
                          className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
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
            <div className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200 animate-in fade-in duration-500">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-lg font-bold text-muted-foreground">O caixa está fechado</h2>
              <p className="text-sm text-muted-foreground/60 mb-6">Inicie o caixa no botão superior para registrar movimentações.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Sidebar de Comissões movida para cima para dar largura 100% à tabela */}
              <div className="w-full space-y-4">
                <Card className="rounded-2xl border shadow-sm border-slate-100 overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Comissões de Hoje
                    </h4>
                    <span className="text-[10px] text-muted-foreground italic">Comissões automáticas baseadas nas configurações dos serviços.</span>
                  </div>
                  <CardContent className="p-4">
                    {Object.keys(comissoesPorProfissional || {}).length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        Aguardando finalizações...
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.values(comissoesPorProfissional as any).map((prof: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-700 truncate mr-2">{prof.nome}</span>
                            <Badge variant="outline" className="font-bold text-[10px] bg-blue-50/50 border-blue-100 text-blue-600 whitespace-nowrap">
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
                <div className="bg-white dark:bg-slate-950 rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 h-9 rounded-lg border-slate-200 text-sm"
                        placeholder="Pesquisar movimentação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <History className="h-3 w-3" />
                      Últimas Movimentações
                    </div>
                  </div>

                  <div className="w-full overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground font-bold text-[10px] uppercase bg-slate-50/50 border-b">
                          <th className="px-2 sm:px-4 py-3">Horário</th>
                          <th className="px-2 sm:px-4 py-3">Descrição</th>
                          <th className="px-2 sm:px-4 py-3 text-center">Operador</th>
                          <th className="px-2 sm:px-4 py-3">Categoria</th>
                          <th className="px-2 sm:px-4 py-3 hidden md:table-cell">Forma</th>
                          <th className="px-2 sm:px-4 py-3 text-right">Valor</th>
                          <th className="px-2 sm:px-4 py-3 hidden sm:table-cell">Status</th>
                          <th className="px-2 py-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingTrans ? (
                          <tr><td colSpan={8} className="p-8 text-center text-xs">Carregando transações...</td></tr>
                        ) : filteredTransacoes?.length === 0 ? (
                          <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-xs">Nenhuma movimentação encontrada.</td></tr>
                        ) : (
                          filteredTransacoes?.map((t) => (
                            <tr key={t.id} className={`hover:bg-slate-50/30 transition-colors ${t.status !== 'ativo' ? 'opacity-40 grayscale' : ''}`}>
                              <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                                {format(new Date(t.data_hora), 'HH:mm')}
                              </td>
                              <td className="px-2 sm:px-4 py-3 font-medium text-[11px] sm:text-xs">
                                <span className="line-clamp-2">{t.descricao}</span>
                                {t.agendamento && <span className="block text-[8px] sm:text-[9px] text-blue-500 font-bold uppercase mt-0.5">Automático</span>}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-[11px] text-muted-foreground text-center font-semibold">
                                <span className="line-clamp-2">{t.agendamento?.profissional?.nome || t.usuario?.nome || '—'}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-3">
                                <Badge variant="outline" className="text-[8px] sm:text-[9px] font-bold rounded-lg px-1.5 sm:px-2 h-auto py-0.5 sm:h-5 border-slate-200 uppercase whitespace-normal text-center leading-tight">
                                  {t.categoria || 'Geral'}
                                </Badge>
                              </td>
                              <td className="px-2 sm:px-4 py-3 capitalize text-[10px] sm:text-[11px] text-muted-foreground hidden md:table-cell">
                                {t.forma_pagamento.replace('_', ' ')}
                              </td>
                              <td className={`px-2 sm:px-4 py-3 text-right font-bold text-[11px] sm:text-xs whitespace-nowrap ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                              </td>
                              <td className="px-2 sm:px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                                {t.status === 'ativo' ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-full text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 h-4 sm:h-5">Ativo</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-rose-600 border-rose-100 rounded-full text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 h-4 sm:h-5 capitalize truncate">{t.status}</Badge>
                                )}
                              </td>
                              <td className="px-1 sm:px-2 py-3 text-right">
                                {t.status === 'ativo' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg">
                                        <MoreVertical className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      {isAdmin && (
                                        <DropdownMenuItem 
                                          className="text-amber-600 focus:text-amber-600 cursor-pointer gap-2 font-bold text-xs"
                                          onClick={() => handleEstorno(t.id)}
                                        >
                                          <Undo2 className="h-3.5 w-3.5" />
                                          Estornar
                                        </DropdownMenuItem>
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
        saldoSistema={resumen?.saldo || 0}
        dataAbertura={caixaAberto?.data_abertura}
        hasPendencias={!!pendencias && pendencias.length > 0}
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
    </div>
  )
}
