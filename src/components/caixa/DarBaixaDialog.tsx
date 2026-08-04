import { useEffect, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTransacao } from '@/hooks/useCaixa'
import { useUpdateAgendamentoStatus } from '@/hooks/useAgendamentos'
import { useSalao } from '@/hooks/useSalao'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useServicos } from '@/hooks/useServicos'
import { useProfissionais } from '@/hooks/useProfissionais'
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'
import { Receipt, UserCircle, Scissors, Clock, CheckCircle2, Plus, Trash2, Tag, DollarSign, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const darBaixaSchema = z.object({
  forma_pagamento: z.enum(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'outros']),
  bandeira_1: z.string().optional(),
  is_split: z.boolean().default(false),
  valor_pagamento_1: z.string().optional(),
  forma_pagamento_2: z.enum(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'outros']).optional(),
  bandeira_2: z.string().optional(),
  valor_pagamento_2: z.string().optional(),
}).refine((data) => {
  if (data.is_split) {
    return !!data.valor_pagamento_1 && !!data.forma_pagamento_2 && !!data.valor_pagamento_2
  }
  return true
}, {
  message: "Preencha todos os campos do pagamento dividido",
  path: ["valor_pagamento_1"],
})

type DarBaixaFormData = z.infer<typeof darBaixaSchema>

interface DarBaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento?: Agendamento | null
  agendamentos?: Agendamento[]
}

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'outros', label: 'Outros' },
]

const BANDEIRAS = ['Visa', 'MasterCard', 'Elo', 'Amex', 'Hipercard', 'Outros']

const formatarMoeda = (val: string): string => {
  const clean = val.replace(/\D/g, '')
  if (!clean) return ''
  const num = parseFloat(clean) / 100
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function DarBaixaDialog({ open, onOpenChange, agendamento, agendamentos }: DarBaixaDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()
  const updateStatus = useUpdateAgendamentoStatus()
  const { data: salao } = useSalao()

  // Unificar agendamento único ou múltiplos agendamentos
  const listAgendamentos = useMemo(() => {
    if (agendamentos && agendamentos.length > 0) return agendamentos
    if (agendamento) return [agendamento]
    return []
  }, [agendamento, agendamentos])

  // Hooks de Dados
  const { data: todosServicos = [] } = useServicos()
  const { data: todosProfissionais = [] } = useProfissionais()

  // Estados para serviços adicionais
  const [servicosAdicionais, setServicosAdicionais] = useState<{
    id: string
    servicoId: string
    profissionalId: string
    valor: number
  }[]>([])

  // Estado para adicionar um novo serviço (inputs temporários)
  const [selectedServicoId, setSelectedServicoId] = useState<string>('ignore')
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('ignore')
  const [valorServicoAdicional, setValorServicoAdicional] = useState<string>('')

  // Estados para desconto
  const [valorDesconto, setValorDesconto] = useState<string>('')

  // Estados de expansão dos painéis
  const [isServicosAdicionaisExpanded, setIsServicosAdicionaisExpanded] = useState(false)
  const [isDescontoExpanded, setIsDescontoExpanded] = useState(false)

  // Valor total das comandas selecionadas
  const agValor = useMemo(() => {
    return listAgendamentos.reduce((acc, ag) => acc + (Number(ag.valor) || 0), 0)
  }, [listAgendamentos])

  const form = useForm<DarBaixaFormData>({
    resolver: zodResolver(darBaixaSchema),
    defaultValues: {
      forma_pagamento: 'pix',
      bandeira_1: '',
      is_split: false,
      valor_pagamento_1: '',
      forma_pagamento_2: 'cartao_credito',
      bandeira_2: '',
      valor_pagamento_2: '',
    },
  })

  const resetStates = () => {
    setServicosAdicionais([])
    setSelectedServicoId('ignore')
    setSelectedProfissionalId('ignore')
    setValorServicoAdicional('')
    setValorDesconto('')
    setIsServicosAdicionaisExpanded(false)
    setIsDescontoExpanded(false)
    setShowConfirmDivergencia(false)
    setPendingFormData(null)
  }

  useEffect(() => {
    if (open) {
      form.reset({
        forma_pagamento: 'pix',
        bandeira_1: '',
        is_split: false,
        valor_pagamento_1: agValor.toFixed(2).replace('.', ','),
        forma_pagamento_2: 'cartao_credito',
        bandeira_2: '',
        valor_pagamento_2: '',
      })
      resetStates()
    }
  }, [open, agValor, form])

  const { isAdmin, usuario: currentUser } = useAuthStore()
  const canConfirm = isAdmin || listAgendamentos.some(ag => ag.profissional_id === currentUser?.id)

  const isSplit = form.watch('is_split')
  const form1 = form.watch('forma_pagamento')
  const v1Str = form.watch('valor_pagamento_1')
  const b1 = form.watch('bandeira_1')
  
  const form2 = form.watch('forma_pagamento_2')
  const v2Str = form.watch('valor_pagamento_2')
  const b2 = form.watch('bandeira_2')

  // Cálculos dinâmicos
  const totalServicosAdicionais = servicosAdicionais.reduce((acc, s) => acc + s.valor, 0)
  const descontoVal = parseFloat(valorDesconto.replace(/\./g, '').replace(',', '.')) || 0
  
  const totalBrutoCalculado = Math.max(0, agValor + totalServicosAdicionais - descontoVal)

  // Sincronizar o valor 1 e valor 2 do formulário de pagamento com o total bruto calculado
  useEffect(() => {
    if (!isSplit) {
      form.setValue('valor_pagamento_1', totalBrutoCalculado.toFixed(2).replace('.', ','))
    } else {
      const v1 = parseFloat(v1Str?.replace(/\./g, '').replace(',', '.') || '0') || 0
      const v2 = Math.max(0, totalBrutoCalculado - v1)
      form.setValue('valor_pagamento_2', v2.toFixed(2).replace('.', ','))
    }
  }, [totalBrutoCalculado, isSplit, form, v1Str])

  // Lógica de Taxas
  const taxasConfig = (salao?.configuracoes as any)?.taxas_cartao || { ativo: false, modo: 'unica', taxa_unica: 0, taxas_bandeira: {} }
  const hasTaxas = taxasConfig.ativo

  const getTaxaPercentual = (forma: string, bandeira: string | undefined): number => {
    if (!hasTaxas || !['cartao_credito', 'cartao_debito'].includes(forma)) return 0
    if (taxasConfig.modo === 'unica') return taxasConfig.taxa_unica || 0
    if (taxasConfig.modo === 'bandeira') {
      const rate = taxasConfig.taxas_bandeira[bandeira || 'Outros']
      return rate !== undefined ? rate : (taxasConfig.taxas_bandeira['Outros'] || 0)
    }
    return 0
  }

  const val1 = parseFloat(v1Str?.replace(/\./g, '').replace(',', '.') || '0') || 0
  const realVal1 = isSplit ? val1 : totalBrutoCalculado
  const pct1 = getTaxaPercentual(form1, b1)
  const taxaVal1 = (realVal1 * pct1) / 100
  const net1 = realVal1 - taxaVal1

  const val2 = parseFloat(v2Str?.replace(/\./g, '').replace(',', '.') || '0') || 0
  const realVal2 = isSplit ? val2 : 0
  const pct2 = getTaxaPercentual(form2 || '', b2)
  const taxaVal2 = (realVal2 * pct2) / 100
  const net2 = realVal2 - taxaVal2

  const totalBruto = realVal1 + realVal2
  const totalTaxas = taxaVal1 + taxaVal2
  const totalLiquido = net1 + net2

  const [showConfirmDivergencia, setShowConfirmDivergencia] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<DarBaixaFormData | null>(null)

  const valorOriginalTotal = agValor + totalServicosAdicionais
  const diferencaValor = valorOriginalTotal - totalBrutoCalculado
  const temDivergenciaValor = Math.abs(diferencaValor) > 0.01 || descontoVal > 0

  async function onSubmit(data: DarBaixaFormData) {
    if (listAgendamentos.length === 0) return

    if (temDivergenciaValor && !pendingFormData) {
      setPendingFormData(data)
      setShowConfirmDivergencia(true)
      return
    }

    await executeBaixa(data || pendingFormData)
  }

  async function executeBaixa(data: DarBaixaFormData) {
    try {
      if (data.is_split && data.valor_pagamento_1 && data.valor_pagamento_2 && data.forma_pagamento_2) {
        if (Math.abs(totalBruto - totalBrutoCalculado) > 0.01) {
          toast({
            title: 'Valores incorretos',
            description: `A soma (R$ ${totalBruto.toFixed(2)}) não bate com o total recalculado (R$ ${totalBrutoCalculado.toFixed(2)})`,
            variant: 'destructive',
          })
          return
        }
      }

      const prop1 = totalBrutoCalculado > 0 ? realVal1 / totalBrutoCalculado : 1
      const prop2 = totalBrutoCalculado > 0 ? realVal2 / totalBrutoCalculado : 0

      // Lista de Itens de Receita
      const itensReceita: {
        tipo: 'principal' | 'adicional'
        descricao: string
        categoria: string
        valorBase: number
        comissaoPercentual: number
        profissionalId: string | null
        agendamentoId: string
      }[] = []

      const getEffectivePct = (itPct: any, profPct: any) => {
        if (itPct !== null && itPct !== undefined && Number(itPct) > 0) return Number(itPct)
        if (profPct !== null && profPct !== undefined && Number(profPct) > 0) return Number(profPct)
        return 0
      }

      // 1. Processar itens de cada agendamento selecionado
      for (const ag of listAgendamentos) {
        const servico = ag.servico
        const agValorIndividual = Number(ag.valor) || 0
        
        // Proporção do desconto global aplicada a este agendamento
        const agProporcao = agValor > 0 ? (agValorIndividual / agValor) : (1 / listAgendamentos.length)
        const agDesconto = descontoVal * agProporcao

        if (ag.itens && ag.itens.length > 0) {
          const totalBrutoItens = ag.itens.reduce((acc: number, it: any) => acc + (Number(it.valor) || 0), 0)
          const proporcaoDesconto = agValorIndividual > 0 && agDesconto > 0 && totalBrutoItens > 0
            ? Math.max(0, agValorIndividual - agDesconto) / totalBrutoItens
            : 1

          ag.itens.forEach((it: any) => {
            const servObj = todosServicos.find((s) => s.id === it.servico_id) || it.servico
            const profObj = todosProfissionais.find((p) => p.id === it.profissional_id) || it.profissional
            const pctComissao = getEffectivePct(it.comissao_percentual, profObj?.comissao_percentual)
            const valorBaseItem = (Number(it.valor) || 0) * proporcaoDesconto

            itensReceita.push({
              tipo: 'principal',
              descricao: `${servObj?.nome || 'Serviço'} - ${ag.cliente?.nome}`,
              categoria: 'Serviço',
              valorBase: valorBaseItem,
              comissaoPercentual: pctComissao,
              profissionalId: it.profissional_id || ag.profissional_id,
              agendamentoId: ag.id,
            })
          })
        } else {
          const valorPrincipalComDesconto = Math.max(0, agValorIndividual - agDesconto)
          const profObj = todosProfissionais.find((p) => p.id === ag.profissional_id) || ag.profissional
          const pctComissao = getEffectivePct(null, (profObj as any)?.comissao_percentual)

          itensReceita.push({
            tipo: 'principal',
            descricao: `${servico?.nome || 'Serviço'} - ${ag.cliente?.nome}`,
            categoria: 'Serviço',
            valorBase: valorPrincipalComDesconto,
            comissaoPercentual: pctComissao,
            profissionalId: ag.profissional_id,
            agendamentoId: ag.id,
          })
        }
      }

      // 2. Serviços Adicionais (atribui ao primeiro agendamento da lista)
      const primaryAgendamentoId = listAgendamentos[0].id
      const primaryClienteNome = listAgendamentos[0].cliente?.nome || 'Cliente'

      servicosAdicionais.forEach(sa => {
        const servObj = todosServicos.find(s => s.id === sa.servicoId)
        const profObj = todosProfissionais.find(p => p.id === sa.profissionalId)
        const pctComissao = getEffectivePct(null, profObj?.comissao_percentual)
        
        itensReceita.push({
          tipo: 'adicional',
          descricao: `[Adicional] ${servObj?.nome || 'Serviço'} - ${primaryClienteNome}`,
          categoria: 'Serviço',
          valorBase: sa.valor,
          comissaoPercentual: pctComissao,
          profissionalId: sa.profissionalId,
          agendamentoId: primaryAgendamentoId,
        })
      })

      // Lançar as transações proporcionalmente no split
      // IMPORTANTE: cada transação de split recebe o seu próprio valor e comissão específicos daquela fatia de pagamento
      for (let idx = 0; idx < itensReceita.length; idx++) {
        const item = itensReceita[idx]
        const profObj = todosProfissionais.find((p) => p.id === item.profissionalId)
        const servicoNome = item.descricao.replace(/ - .*$/, '').replace(/^\[Adicional\] /, '')

        // Lançar Parte 1 (Forma 1)
        const bruto1 = item.valorBase * prop1
        if (bruto1 > 0.005) {
          const pctTaxa1 = getTaxaPercentual(data.forma_pagamento, data.bandeira_1)
          const taxa1 = (bruto1 * pctTaxa1) / 100
          const liquido1 = bruto1 - taxa1
          const comissao1 = (liquido1 * item.comissaoPercentual) / 100

          const breakdownParte1 = [{
            profissional_id: item.profissionalId,
            profissional_nome: profObj?.nome || 'Profissional',
            servico_nome: servicoNome,
            valor_servico: Math.round(liquido1 * 100) / 100,
            comissao_percentual: item.comissaoPercentual,
            comissao_valor: Math.round(comissao1 * 100) / 100,
          }]

          const prefix = data.is_split ? '[1/2] ' : ''
          const metadata = {
            pagamento: {
              valor_bruto: bruto1,
              taxa_aplicada: taxa1,
              taxa_percentual: pctTaxa1,
              bandeira_cartao: data.forma_pagamento === 'cartao_credito' ? data.bandeira_1 : null,
              valor_liquido: liquido1,
              base_comissao: liquido1
            },
            profissional_id: item.profissionalId,
            comissoes_breakdown: breakdownParte1
          }

          await createTransacao.mutateAsync({
            agendamento_id: item.agendamentoId,
            tipo: 'entrada',
            valor: liquido1,
            forma_pagamento: data.forma_pagamento,
            categoria: item.categoria,
            descricao: `${prefix}${item.descricao}`,
            comissao_valor: comissao1,
            taxa_cartao: taxa1,
            data_hora: new Date().toISOString(),
            status: 'ativo',
            caixa_id: null,
            metadata: metadata as any
          })
        }

        // Lançar Parte 2 (Forma 2) se houver split
        if (data.is_split && prop2 > 0) {
          const bruto2 = item.valorBase * prop2
          if (bruto2 > 0.005) {
            const pctTaxa2 = getTaxaPercentual(data.forma_pagamento_2 || '', data.bandeira_2)
            const taxa2 = (bruto2 * pctTaxa2) / 100
            const liquido2 = bruto2 - taxa2
            const comissao2 = (liquido2 * item.comissaoPercentual) / 100

            const breakdownParte2 = [{
              profissional_id: item.profissionalId,
              profissional_nome: profObj?.nome || 'Profissional',
              servico_nome: servicoNome,
              valor_servico: Math.round(liquido2 * 100) / 100,
              comissao_percentual: item.comissaoPercentual,
              comissao_valor: Math.round(comissao2 * 100) / 100,
            }]

            const metadata = {
              pagamento: {
                valor_bruto: bruto2,
                taxa_aplicada: taxa2,
                taxa_percentual: pctTaxa2,
                bandeira_cartao: data.forma_pagamento_2 === 'cartao_credito' ? data.bandeira_2 : null,
                valor_liquido: liquido2,
                base_comissao: liquido2
              },
              profissional_id: item.profissionalId,
              comissoes_breakdown: breakdownParte2
            }

            await createTransacao.mutateAsync({
              agendamento_id: item.agendamentoId,
              tipo: 'entrada',
              valor: liquido2,
              forma_pagamento: data.forma_pagamento_2!,
              categoria: item.categoria,
              descricao: `[2/2] ${item.descricao}`,
              comissao_valor: comissao2,
              taxa_cartao: taxa2,
              data_hora: new Date().toISOString(),
              status: 'ativo',
              caixa_id: null,
              metadata: metadata as any
            })
          }
        }
      }

      // Atualizar status de todos os agendamentos selecionados para concluído
      for (const ag of listAgendamentos) {
        try {
          await updateStatus.mutateAsync({ id: ag.id, status: 'concluido' })
        } catch (err) {
          console.error('Erro ao atualizar agendamento:', err)
        }
      }

      toast({
        title: 'Baixa realizada!',
        description: `${listAgendamentos.length > 1 ? `${listAgendamentos.length} comandas baixadas` : 'Baixa concluída'}. O valor líquido de R$ ${totalLiquido.toFixed(2).replace('.', ',')} entrou no caixa.`,
      })

      onOpenChange(false)
      form.reset()
      resetStates()
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (listAgendamentos.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* PARTE 1: Cabeçalho */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-background shrink-0">
          <DialogTitle className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Registro de Pagamento
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Conclua {listAgendamentos.length > 1 ? `as ${listAgendamentos.length} comandas selecionadas` : 'o atendimento'} e registre a transação no caixa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
            
            {/* Conteúdo Rolável */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* PARTE 2: Resumo do Atendimento / Comandas Selecionadas */}
              <div className="bg-background rounded-xl border border-border shadow-sm p-4 relative overflow-hidden transition-all hover:border-primary/20 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-primary" />
                    {listAgendamentos.length > 1 ? `${listAgendamentos.length} Comandas Selecionadas` : 'Resumo do Atendimento'}
                  </span>
                  {listAgendamentos.length > 1 && (
                    <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      Subtotal: R$ {agValor.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {listAgendamentos.map((ag) => (
                    <div key={ag.id} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-border/40 text-xs space-y-1.5">
                      <div className="flex justify-between items-center font-bold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          {ag.cliente?.nome}
                        </span>
                        <span className="text-purple-700 dark:text-purple-300 font-extrabold">
                          R$ {ag.valor.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {ag.itens && ag.itens.length > 0 ? (
                        <div className="space-y-1 pl-5">
                          {ag.itens.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Scissors className="h-3 w-3 text-purple-600" />
                                {it.servico?.nome || 'Serviço'}
                                <span className="text-[10px]">({it.profissional?.nome || ag.profissional?.nome})</span>
                              </span>
                              <span className="font-semibold text-foreground">R$ {Number(it.valor).toFixed(2).replace('.', ',')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between text-[11px] text-muted-foreground pl-5">
                          <span className="flex items-center gap-1">
                            <Scissors className="h-3 w-3 text-purple-600" />
                            {ag.servico?.nome}
                            <span className="text-[10px]">({ag.profissional?.nome})</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 pl-5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ag.data_hora), "dd/MM/yyyy 'às' HH:mm")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Serviços Adicionais */}
              <div className="bg-background rounded-xl border border-border shadow-sm transition-all hover:border-primary/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsServicosAdicionaisExpanded(!isServicosAdicionaisExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors border-b border-border/40"
                >
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5 text-primary" />
                    Serviços Adicionais {servicosAdicionais.length > 0 && `(${servicosAdicionais.length})`}
                  </h4>
                  {isServicosAdicionaisExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isServicosAdicionaisExpanded && (
                  <div className="p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                    {/* Lista de Adicionados */}
                    {servicosAdicionais.length > 0 && (
                      <div className="space-y-1.5">
                        {servicosAdicionais.map((sa) => {
                          const serv = todosServicos.find(s => s.id === sa.servicoId)
                          const prof = todosProfissionais.find(p => p.id === sa.profissionalId)
                          return (
                            <div key={sa.id} className="flex items-center justify-between bg-accent/25 px-2.5 py-1.5 rounded-lg border border-border/40 text-xs">
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{serv?.nome || 'Serviço'}</p>
                                <p className="text-[10px] text-muted-foreground">com {prof?.nome || 'Profissional'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">R$ {sa.valor.toFixed(2).replace('.', ',')}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setServicosAdicionais(prev => prev.filter(item => item.id !== sa.id))}
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Formulário de Adição Rápida */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Serviço</Label>
                        <Select 
                          value={selectedServicoId} 
                          onValueChange={(val) => {
                            setSelectedServicoId(val)
                            const serv = todosServicos.find(s => s.id === val)
                            if (serv) {
                              setValorServicoAdicional(serv.valor.toFixed(2).replace('.', ','))
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg border-border">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore" disabled>Selecione...</SelectItem>
                            {todosServicos.filter(s => s.ativo).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Profissional</Label>
                        <Select 
                          value={selectedProfissionalId} 
                          onValueChange={setSelectedProfissionalId}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg border-border">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore" disabled>Selecione...</SelectItem>
                            {todosProfissionais.filter(p => p.ativo && p.pode_atender).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Valor do Serviço (R$)</Label>
                        <Input 
                          value={valorServicoAdicional}
                          onChange={(e) => setValorServicoAdicional(formatarMoeda(e.target.value))}
                          placeholder="0,00"
                          className="h-8 text-xs font-bold border-border"
                        />
                      </div>

                      <div className="flex items-end col-span-2 sm:col-span-1">
                        <Button
                          type="button"
                          onClick={() => {
                            if (selectedServicoId === 'ignore' || selectedProfissionalId === 'ignore' || !valorServicoAdicional) {
                              toast({
                                title: 'Dados incompletos',
                                description: 'Preencha serviço, profissional e valor para adicionar.',
                                variant: 'destructive'
                              })
                              return
                            }
                            const val = parseFloat(valorServicoAdicional.replace(/\./g, '').replace(',', '.'))
                            if (isNaN(val) || val <= 0) {
                              toast({
                                title: 'Valor inválido',
                                description: 'Digite um valor maior que zero.',
                                variant: 'destructive'
                              })
                              return
                            }
                            setServicosAdicionais(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                servicoId: selectedServicoId,
                                profissionalId: selectedProfissionalId,
                                valor: val
                              }
                            ])
                            setSelectedServicoId('ignore')
                            setSelectedProfissionalId('ignore')
                            setValorServicoAdicional('')
                          }}
                          className="h-8 w-full text-[10px] font-bold uppercase tracking-wider rounded-lg gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Desconto */}
              <div className="bg-background rounded-xl border border-border shadow-sm transition-all hover:border-primary/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsDescontoExpanded(!isDescontoExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors border-b border-border/40"
                >
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Desconto {parseFloat(valorDesconto.replace(/\./g, '').replace(',', '.')) > 0 && `(R$ ${valorDesconto})`}
                  </h4>
                  {isDescontoExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isDescontoExpanded && (
                  <div className="p-4 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Desconto (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-red-500" />
                      <Input
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(formatarMoeda(e.target.value))}
                        placeholder="0,00"
                        className="h-9 text-xs font-bold pl-8 border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo do Total Atualizado */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Valor do Agendamento</span>
                  <span className="font-semibold text-foreground">R$ {agValor.toFixed(2).replace('.', ',')}</span>
                </div>
                {totalServicosAdicionais > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Serviços Adicionais</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ R$ {totalServicosAdicionais.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {descontoVal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Desconto Aplicado</span>
                    <span className="font-semibold text-red-500">- R$ {descontoVal.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border mt-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Total a Pagar</span>
                  <span className="text-lg font-black text-foreground tracking-tight">
                    R$ {totalBrutoCalculado.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* PARTE 3: Área de Pagamento */}
              <div className="space-y-4">
                
                <div className="flex items-center justify-between bg-background px-4 py-3 rounded-xl border border-border shadow-sm transition-all hover:border-primary/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Dividir Pagamento</Label>
                    <p className="text-[10px] text-muted-foreground">Pagar com mais de um método</p>
                  </div>
                  <Controller
                    control={form.control}
                    name="is_split"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                {!isSplit ? (
                  <div className="bg-background p-4 rounded-xl border border-border shadow-sm space-y-4 transition-all hover:border-primary/20">
                    <FormField
                      control={form.control}
                      name="forma_pagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Método de Recebimento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 border-border">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FORMAS_PAGAMENTO.map((fp) => (
                                <SelectItem key={fp.value} value={fp.value} className="font-medium">
                                  {fp.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    {form1 === 'cartao_credito' && hasTaxas && taxasConfig.modo === 'bandeira' && (
                      <FormField
                        control={form.control}
                        name="bandeira_1"
                        render={({ field }) => (
                          <FormItem className="animate-in slide-in-from-top-2 duration-300">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-primary">Bandeira do Cartão</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 border-primary/20 bg-primary/5 focus:ring-primary/30">
                                  <SelectValue placeholder="Qual a bandeira?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BANDEIRAS.map((b) => (
                                  <SelectItem key={b} value={b} className="font-medium">{b}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-background p-4 rounded-xl border border-border shadow-sm transition-all hover:border-primary/20">
                    {/* FRAÇÃO 1 */}
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="forma_pagamento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Forma 1</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-xs font-medium border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {FORMAS_PAGAMENTO.map((fp) => (
                                    <SelectItem key={fp.value} value={fp.value} className="text-xs font-medium">
                                      {fp.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="valor_pagamento_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor (R$)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-9 text-xs font-bold border-border"
                                  placeholder="0,00"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(formatarMoeda(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {form1 === 'cartao_credito' && hasTaxas && taxasConfig.modo === 'bandeira' && (
                        <FormField
                          control={form.control}
                          name="bandeira_1"
                          render={({ field }) => (
                            <FormItem className="animate-in slide-in-from-top-1 duration-200">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs border-primary/20 bg-primary/5 text-primary font-semibold">
                                    <SelectValue placeholder="Selecione a Bandeira" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BANDEIRAS.map((b) => <SelectItem key={b} value={b} className="text-xs font-medium">{b}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* FRAÇÃO 2 */}
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="forma_pagamento_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Forma 2</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-xs font-medium border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {FORMAS_PAGAMENTO.map((fp) => (
                                    <SelectItem key={fp.value} value={fp.value} className="text-xs font-medium">
                                      {fp.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="valor_pagamento_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Restante (R$)</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly className="h-9 text-xs font-bold bg-muted text-muted-foreground border-dashed border-border" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form2 === 'cartao_credito' && hasTaxas && taxasConfig.modo === 'bandeira' && (
                        <FormField
                          control={form.control}
                          name="bandeira_2"
                          render={({ field }) => (
                            <FormItem className="animate-in slide-in-from-top-1 duration-200">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs border-primary/20 bg-primary/5 text-primary font-semibold">
                                    <SelectValue placeholder="Selecione a Bandeira" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BANDEIRAS.map((b) => <SelectItem key={b} value={b} className="text-xs font-medium">{b}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* PARTE 4: Alerta de Divergência de Valor / Desconto */}
              {temDivergenciaValor && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Atenção: Valor a receber difere do total dos serviços</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight">
                    Total dos Serviços: <strong>R$ {valorOriginalTotal.toFixed(2).replace('.', ',')}</strong> | 
                    Valor a Receber: <strong>R$ {totalBrutoCalculado.toFixed(2).replace('.', ',')}</strong>
                    {descontoVal > 0 && ` (Desconto: R$ ${descontoVal.toFixed(2).replace('.', ',')})`}
                  </p>
                </div>
              )}

              {/* PARTE 5: Resumo Financeiro (Aparece se houver taxas) */}
              {(hasTaxas && (form1 === 'cartao_credito' || (isSplit && form2 === 'cartao_credito'))) && (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 space-y-2 animate-in fade-in duration-500">
                  <h4 className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resumo Líquido
                  </h4>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Bruto</span>
                    <span className="font-semibold text-foreground">R$ {totalBruto.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-500 font-semibold border-b border-border/40 pb-2">
                    <span>Taxas Retidas</span>
                    <span>- R$ {totalTaxas.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-foreground">Total Líquido Caixa</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">R$ {totalLiquido.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium italic pt-1 leading-tight text-right">
                    Comissões e o caixa serão calculados sobre o valor líquido.
                  </p>
                </div>
              )}

            </div>

            {/* PARTE 6: Rodapé Fixo */}
            <div className="px-6 py-4 border-t border-border bg-background flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTransacao.isPending || updateStatus.isPending || !canConfirm}
                className="w-full sm:w-auto shadow-lg shadow-primary/10"
              >
                {createTransacao.isPending || updateStatus.isPending
                  ? 'Salvando...'
                  : !canConfirm 
                    ? 'Acesso Restrito'
                    : 'Lançar Recebimento'}
              </Button>
            </div>
            
          </form>
        </Form>

        {/* DIÁLOGO DE CONFIRMAÇÃO DE DIVERGÊNCIA DE VALOR */}
        <AlertDialog open={showConfirmDivergencia} onOpenChange={setShowConfirmDivergencia}>
          <AlertDialogContent className="sm:max-w-[440px] border-amber-500/30 bg-background rounded-2xl p-6 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar Lançamento com Diferença de Valor
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-2 space-y-3">
                <p>
                  O valor total a ser baixado no caixa (<strong>R$ {totalBrutoCalculado.toFixed(2).replace('.', ',')}</strong>) é{' '}
                  {totalBrutoCalculado < valorOriginalTotal ? 'menor do que' : 'diferente do'} valor total dos serviços selecionados (<strong>R$ {valorOriginalTotal.toFixed(2).replace('.', ',')}</strong>).
                </p>
                
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5 text-xs text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor dos Serviços:</span>
                    <span className="font-semibold">R$ {valorOriginalTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {descontoVal > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>Desconto Informado:</span>
                      <span>- R$ {descontoVal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1.5 border-t border-border/50">
                    <span>Valor Final a Entrar no Caixa:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">R$ {totalBrutoCalculado.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <p className="text-[11px] font-medium text-foreground">
                  Por favor, verifique se houve algum erro de digitação antes de continuar. Deseja realmente lançar este recebimento?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel onClick={() => setShowConfirmDivergencia(false)} className="text-xs h-9">
                Revisar Valores
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowConfirmDivergencia(false)
                  if (pendingFormData) {
                    executeBaixa(pendingFormData)
                  }
                }}
                className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Sim, Lançar Recebimento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  )
}
