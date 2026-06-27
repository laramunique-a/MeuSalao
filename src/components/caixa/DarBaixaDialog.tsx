import { useEffect } from 'react'
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
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'
import { Receipt, UserCircle, Scissors, Clock, CheckCircle2 } from 'lucide-react'

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

  // Auto-calcular valor 2 quando valor 1 muda
  useEffect(() => {
    if (isSplit && agendamento && v1Str) {
      const v1 = parseFloat(v1Str.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(v1)) {
        const v2 = Math.max(0, agendamento.valor - v1)
        form.setValue('valor_pagamento_2', v2.toFixed(2).replace('.', ','))
      }
    }
  }, [v1Str, isSplit, agendamento, form])

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

  // Cálculos dinâmicos
  const agValor = agendamento?.valor || 0
  
  const val1 = parseFloat(v1Str?.replace(/\./g, '').replace(',', '.') || '0') || 0
  const realVal1 = isSplit ? val1 : agValor
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

      // Split Logic
      if (data.is_split && data.valor_pagamento_1 && data.valor_pagamento_2 && data.forma_pagamento_2) {
        if (Math.abs((totalBruto) - agendamento.valor) > 0.01) {
          toast({
            title: 'Valores incorretos',
            description: `A soma (R$ ${totalBruto.toFixed(2)}) não bate com o total (R$ ${agendamento.valor.toFixed(2)})`,
            variant: 'destructive',
          })
          return
        }

        const comissao1 = (net1 * comissaoPercentual) / 100
        const mdata1 = {
          pagamento: {
            valor_bruto: realVal1,
            taxa_aplicada: taxaVal1,
            taxa_percentual: pct1,
            bandeira_cartao: form1 === 'cartao_credito' ? data.bandeira_1 : null,
            valor_liquido: net1,
            base_comissao: net1
          }
        }

        await createTransacao.mutateAsync({
          agendamento_id: agendamento.id,
          tipo: 'entrada',
          valor: net1,
          forma_pagamento: data.forma_pagamento,
          categoria: 'Serviço',
          descricao: `[1/2] ${servico?.nome} - ${agendamento.cliente?.nome}`,
          comissao_valor: comissao1,
          taxa_cartao: taxaVal1,
          data_hora: new Date().toISOString(),
          status: 'ativo',
          caixa_id: null,
          metadata: mdata1 as any
        })

        const comissao2 = (net2 * comissaoPercentual) / 100
        const mdata2 = {
          pagamento: {
            valor_bruto: realVal2,
            taxa_aplicada: taxaVal2,
            taxa_percentual: pct2,
            bandeira_cartao: data.forma_pagamento_2 === 'cartao_credito' ? data.bandeira_2 : null,
            valor_liquido: net2,
            base_comissao: net2
          }
        }

        await createTransacao.mutateAsync({
          agendamento_id: agendamento.id,
          tipo: 'entrada',
          valor: net2,
          forma_pagamento: data.forma_pagamento_2,
          categoria: 'Serviço',
          descricao: `[2/2] ${servico?.nome} - ${agendamento.cliente?.nome}`,
          comissao_valor: comissao2,
          taxa_cartao: taxaVal2,
          data_hora: new Date().toISOString(),
          status: 'ativo',
          caixa_id: null,
          metadata: mdata2 as any
        })

      } else {
        // Single Payment Logic
        const comissaoUnica = (net1 * comissaoPercentual) / 100
        const mdataUnico = {
          pagamento: {
            valor_bruto: realVal1,
            taxa_aplicada: taxaVal1,
            taxa_percentual: pct1,
            bandeira_cartao: data.forma_pagamento === 'cartao_credito' ? data.bandeira_1 : null,
            valor_liquido: net1,
            base_comissao: net1
          }
        }

        await createTransacao.mutateAsync({
          agendamento_id: agendamento.id,
          tipo: 'entrada',
          valor: net1, // LÍQUIDO vai para o caixa
          forma_pagamento: data.forma_pagamento,
          categoria: 'Serviço',
          descricao: `${servico?.nome} - ${agendamento.cliente?.nome}`,
          comissao_valor: comissaoUnica,
          taxa_cartao: taxaVal1,
          data_hora: new Date().toISOString(),
          status: 'ativo',
          caixa_id: null,
          metadata: mdataUnico as any
        })
      }

      // O status do agendamento é atualizado automaticamente dentro do caixaService.create
      // quando agendamento_id é fornecido — não é necessário chamar updateStatus aqui.

      toast({
        title: 'Baixa realizada!',
        description: `O valor líquido de R$ ${totalLiquido.toFixed(2).replace('.',',')} entrou no caixa.`,
      })

      onOpenChange(false)
      form.reset()
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

                <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor Bruto</span>
                  <span className="text-lg font-black text-foreground tracking-tight">
                    R$ {agendamento.valor.toFixed(2).replace('.', ',')}
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
