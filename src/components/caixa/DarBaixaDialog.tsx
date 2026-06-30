import { useEffect, useState } from 'react'
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
import { Receipt, UserCircle, Scissors, Clock, CheckCircle2, Plus, Trash2, Tag, DollarSign } from 'lucide-react'

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
  agendamento: Agendamento | null
}

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'outros', label: 'Outros' },
]

const BANDEIRAS = ['Visa', 'MasterCard', 'Elo', 'Amex', 'Hipercard', 'Outros']

export function DarBaixaDialog({ open, onOpenChange, agendamento }: DarBaixaDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()
  const updateStatus = useUpdateAgendamentoStatus()
  const { data: salao } = useSalao()

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

  // Estados para valor extra e desconto
  const [valorExtra, setValorExtra] = useState<string>('')
  const [descricaoExtra, setDescricaoExtra] = useState<string>('')
  const [valorDesconto, setValorDesconto] = useState<string>('')

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
    setValorExtra('')
    setDescricaoExtra('')
    setValorDesconto('')
  }

  useEffect(() => {
    if (open) {
      form.reset({
        forma_pagamento: 'pix',
        bandeira_1: '',
        is_split: false,
        valor_pagamento_1: agendamento?.valor.toFixed(2).replace('.', ',') || '',
        forma_pagamento_2: 'cartao_credito',
        bandeira_2: '',
        valor_pagamento_2: '',
      })
      resetStates()
    }
  }, [open, agendamento, form])

  const { isAdmin, usuario: currentUser } = useAuthStore()
  const isOwnAppointment = agendamento?.profissional_id === currentUser?.id
  const canConfirm = isAdmin || isOwnAppointment

  const isSplit = form.watch('is_split')
  const form1 = form.watch('forma_pagamento')
  const v1Str = form.watch('valor_pagamento_1')
  const b1 = form.watch('bandeira_1')
  
  const form2 = form.watch('forma_pagamento_2')
  const v2Str = form.watch('valor_pagamento_2')
  const b2 = form.watch('bandeira_2')

  // Cálculos dinâmicos
  const agValor = agendamento?.valor || 0
  
  const totalServicosAdicionais = servicosAdicionais.reduce((acc, s) => acc + s.valor, 0)
  const extraVal = parseFloat(valorExtra.replace(/\./g, '').replace(',', '.')) || 0
  const descontoVal = parseFloat(valorDesconto.replace(/\./g, '').replace(',', '.')) || 0
  
  const totalBrutoCalculado = Math.max(0, agValor + totalServicosAdicionais + extraVal - descontoVal)

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
    if (!hasTaxas || forma !== 'cartao_credito') return 0
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

  async function onSubmit(data: DarBaixaFormData) {
    if (!agendamento) return

    try {
      const servico = agendamento.servico
      const profissional = agendamento.profissional
      const comissaoPercentual = (profissional as any)?.comissao_percentual || 0

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
        tipo: 'principal' | 'adicional' | 'extra'
        descricao: string
        categoria: string
        valorBase: number
        comissaoPercentual: number
      }[] = []

      // 1. Serviço Principal com desconto proporcional
      const valorPrincipalComDesconto = Math.max(0, agValor - descontoVal)
      itensReceita.push({
        tipo: 'principal',
        descricao: `${servico?.nome} - ${agendamento.cliente?.nome}`,
        categoria: 'Serviço',
        valorBase: valorPrincipalComDesconto,
        comissaoPercentual: comissaoPercentual
      })

      // 2. Serviços Adicionais
      servicosAdicionais.forEach(sa => {
        const servObj = todosServicos.find(s => s.id === sa.servicoId)
        const profObj = todosProfissionais.find(p => p.id === sa.profissionalId)
        const pctComissao = profObj?.comissao_percentual || 0
        
        itensReceita.push({
          tipo: 'adicional',
          descricao: `[Adicional] ${servObj?.nome || 'Serviço'} - ${agendamento.cliente?.nome}`,
          categoria: 'Serviço',
          valorBase: sa.valor,
          comissaoPercentual: pctComissao
        })
      })

      // 3. Item Extra
      if (extraVal > 0) {
        itensReceita.push({
          tipo: 'extra',
          descricao: `[Extra] ${descricaoExtra || 'Valor Extra'} - ${agendamento.cliente?.nome}`,
          categoria: 'Outros',
          valorBase: extraVal,
          comissaoPercentual: 0
        })
      }

      // Lançar as transações proporcionalmente no split
      for (const item of itensReceita) {
        // Lançar Parte 1 (Forma 1)
        const bruto1 = item.valorBase * prop1
        if (bruto1 > 0.005) {
          const pctTaxa1 = getTaxaPercentual(data.forma_pagamento, data.bandeira_1)
          const taxa1 = (bruto1 * pctTaxa1) / 100
          const liquido1 = bruto1 - taxa1
          const comissao1 = (liquido1 * item.comissaoPercentual) / 100

          const prefix = data.is_split ? '[1/2] ' : ''
          const metadata = {
            pagamento: {
              valor_bruto: bruto1,
              taxa_aplicada: taxa1,
              taxa_percentual: pctTaxa1,
              bandeira_cartao: data.forma_pagamento === 'cartao_credito' ? data.bandeira_1 : null,
              valor_liquido: liquido1,
              base_comissao: liquido1
            }
          }

          await createTransacao.mutateAsync({
            agendamento_id: agendamento.id,
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

            const metadata = {
              pagamento: {
                valor_bruto: bruto2,
                taxa_aplicada: taxa2,
                taxa_percentual: pctTaxa2,
                bandeira_cartao: data.forma_pagamento_2 === 'cartao_credito' ? data.bandeira_2 : null,
                valor_liquido: liquido2,
                base_comissao: liquido2
              }
            }

            await createTransacao.mutateAsync({
              agendamento_id: agendamento.id,
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

      toast({
        title: 'Baixa realizada!',
        description: `O valor líquido de R$ ${totalLiquido.toFixed(2).replace('.', ',')} entrou no caixa.`,
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

  if (!agendamento) return null

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
            Conclua o atendimento e registre a transação no caixa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
            
            {/* Conteúdo Rolável */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* PARTE 2: Resumo do Atendimento */}
              <div className="bg-background rounded-xl border border-border shadow-sm p-4 relative overflow-hidden transition-all hover:border-primary/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5 w-full">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground">{agendamento.cliente?.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{agendamento.servico?.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(agendamento.data_hora), "dd/MM/yyyy 'às' HH:mm")} • com {agendamento.profissional?.nome}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serviços Adicionais */}
              <div className="bg-background rounded-xl border border-border shadow-sm p-4 space-y-3 transition-all hover:border-primary/20">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 border-b border-border pb-1.5">
                  <Scissors className="h-3.5 w-3.5 text-primary" />
                  Serviços Adicionais
                </h4>

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
                      onChange={(e) => setValorServicoAdicional(e.target.value.replace(/[^\d,.]/g, ''))}
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

              {/* Extras e Descontos */}
              <div className="bg-background rounded-xl border border-border shadow-sm p-4 space-y-3 transition-all hover:border-primary/20">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 border-b border-border pb-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Extras e Descontos
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Valor Extra (R$)</Label>
                    <div className="relative">
                      <Plus className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                      <Input
                        value={valorExtra}
                        onChange={(e) => setValorExtra(e.target.value.replace(/[^\d,.]/g, ''))}
                        placeholder="0,00"
                        className="h-9 text-xs font-bold pl-8 border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Desconto (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-red-500" />
                      <Input
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(e.target.value.replace(/[^\d,.]/g, ''))}
                        placeholder="0,00"
                        className="h-9 text-xs font-bold pl-8 border-border"
                      />
                    </div>
                  </div>
                </div>

                {parseFloat(valorExtra.replace(/\./g, '').replace(',', '.') || '0') > 0 && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Descrição do Extra (ex: Produto)</Label>
                    <Input
                      value={descricaoExtra}
                      onChange={(e) => setDescricaoExtra(e.target.value)}
                      placeholder="Ex: Venda de Shampoo, Taxa de serviço"
                      className="h-9 text-xs border-border"
                    />
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
                {extraVal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Valor Extra</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ R$ {extraVal.toFixed(2).replace('.', ',')}</span>
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
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value.replace(/[^\d,.]/g, ''))}
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

              {/* PARTE 4: Resumo Financeiro (Aparece se houver taxas) */}
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

            {/* PARTE 5: Rodapé Fixo */}
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

      </DialogContent>
    </Dialog>
  )
}
