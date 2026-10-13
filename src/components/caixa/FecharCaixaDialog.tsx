import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFecharCaixa, useTransacoesByCaixa } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { ClipboardCheck, AlertCircle, Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento } from '@/types/models'

interface FecharCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caixaId: string
  saldoSistema?: number
  dataAbertura?: string
  pendencias?: Agendamento[]
}

const formatarMoedaInput = (val: string): string => {
  const clean = val.replace(/\D/g, '')
  if (!clean) return ''
  const num = parseFloat(clean) / 100
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const parseMoeda = (val: string): number => {
  if (!val) return 0
  const clean = val.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

export function FecharCaixaDialog({
  open,
  onOpenChange,
  caixaId,
  dataAbertura,
  pendencias = [],
}: FecharCaixaDialogProps) {
  const { toast } = useToast()
  const fecharCaixa = useFecharCaixa()
  const { data: transacoes } = useTransacoesByCaixa(open ? caixaId : null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [dataFimFechamento, setDataFimFechamento] = useState(todayStr)
  const [confirmarSemBaixa, setConfirmarSemBaixa] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  // Valores preenchidos pelo operador (Fechamento Cego)
  const [valDinheiro, setValDinheiro] = useState('')
  const [valPix, setValPix] = useState('')
  const [valCartaoCredito, setValCartaoCredito] = useState('')
  const [valCartaoDebito, setValCartaoDebito] = useState('')
  const [valOutros, setValOutros] = useState('')

  // Estado da etapa de confirmação de diferenças
  const [etapaConferencia, setEtapaConferencia] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmarSemBaixa(false)
      setObservacoes('')
      setDataFimFechamento(format(new Date(), 'yyyy-MM-dd'))
      setValDinheiro('')
      setValPix('')
      setValCartaoCredito('')
      setValCartaoDebito('')
      setValOutros('')
      setEtapaConferencia(false)
    }
  }, [open])

  // Total digitado pelo operador em tempo real
  const numDinheiro = parseMoeda(valDinheiro)
  const numPix = parseMoeda(valPix)
  const numCartaoCredito = parseMoeda(valCartaoCredito)
  const numCartaoDebito = parseMoeda(valCartaoDebito)
  const numOutros = parseMoeda(valOutros)
  const totalInformado = numDinheiro + numPix + numCartaoCredito + numCartaoDebito + numOutros

  // Apuração interna do sistema por forma de pagamento (mantida oculta do operador)
  const apuracaoSistema = useMemo(() => {
    if (!transacoes || !dataFimFechamento) {
      return {
        dinheiro: 0,
        pix: 0,
        cartao_credito: 0,
        cartao_debito: 0,
        outros: 0,
        total: 0,
        posteriorCount: 0,
      }
    }

    const [year, month, day] = dataFimFechamento.split('T')[0].split('-').map(Number)
    const cutoffDate = new Date(year, month - 1, day, 23, 59, 59, 999)

    let dinheiro = 0
    let pix = 0
    let cartao_credito = 0
    let cartao_debito = 0
    let outros = 0
    let posteriorCount = 0

    for (const t of transacoes) {
      if (t.status !== 'ativo') continue
      const tDate = new Date(t.data_hora)

      // Usar valor bruto da transação sem abater taxa de cartão
      const valBruto = t.tipo === 'entrada'
        ? (Number((t.metadata as any)?.pagamento?.valor_bruto) || (Number(t.valor) + Number(t.taxa_cartao || 0)))
        : -Number(t.valor)

      if (tDate <= cutoffDate) {
        if (t.forma_pagamento === 'dinheiro') {
          dinheiro += valBruto
        } else if (t.forma_pagamento === 'pix') {
          pix += valBruto
        } else if (t.forma_pagamento === 'cartao_credito') {
          cartao_credito += valBruto
        } else if (t.forma_pagamento === 'cartao_debito') {
          cartao_debito += valBruto
        } else {
          outros += valBruto
        }
      } else {
        posteriorCount++
      }
    }

    const total = dinheiro + pix + cartao_credito + cartao_debito + outros

    return {
      dinheiro,
      pix,
      cartao_credito,
      cartao_debito,
      outros,
      total,
      posteriorCount,
    }
  }, [transacoes, dataFimFechamento])

  // Diferenças calculadas internamente (operador vê apenas as diferenças, nunca o valor base do sistema)
  const diferencas = useMemo(() => {
    const dDinheiro = numDinheiro - apuracaoSistema.dinheiro
    const dPix = numPix - apuracaoSistema.pix
    const dCredito = numCartaoCredito - apuracaoSistema.cartao_credito
    const dDebito = numCartaoDebito - apuracaoSistema.cartao_debito
    const dOutros = numOutros - apuracaoSistema.outros
    const dTotal = totalInformado - apuracaoSistema.total

    const hasDivergencia =
      Math.abs(dDinheiro) > 0.01 ||
      Math.abs(dPix) > 0.01 ||
      Math.abs(dCredito) > 0.01 ||
      Math.abs(dDebito) > 0.01 ||
      Math.abs(dOutros) > 0.01

    return {
      dinheiro: dDinheiro,
      pix: dPix,
      cartao_credito: dCredito,
      cartao_debito: dDebito,
      outros: dOutros,
      total: dTotal,
      hasDivergencia,
    }
  }, [numDinheiro, numPix, numCartaoCredito, numCartaoDebito, numOutros, totalInformado, apuracaoSistema])

  const hasPendencias = pendencias.length > 0

  function handleAvancarParaConferencia(e: React.FormEvent) {
    e.preventDefault()

    if (hasPendencias && !confirmarSemBaixa) {
      toast({
        title: 'Confirmação pendente',
        description: 'Você precisa confirmar que deseja prosseguir sem realizar a baixa das pendências.',
        variant: 'destructive',
      })
      return
    }

    // Se houver qualquer divergência ou para confirmar o fechamento, avança para a tela de conferência
    setEtapaConferencia(true)
  }

  async function handleFinalizarFechamento() {
    if (diferencas.hasDivergencia && (!observacoes || observacoes.trim().length < 5)) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Foi identificada divergência no fechamento. Por favor, preencha a justificativa/observação (mínimo de 5 caracteres).',
        variant: 'destructive',
      })
      return
    }

    try {
      const detalheObservacoes = `[Fechamento por Formas de Pagamento]: ` +
        `Dinheiro: R$ ${numDinheiro.toFixed(2)} | ` +
        `PIX: R$ ${numPix.toFixed(2)} | ` +
        `Crédito: R$ ${numCartaoCredito.toFixed(2)} | ` +
        `Débito: R$ ${numCartaoDebito.toFixed(2)} | ` +
        `Outros: R$ ${numOutros.toFixed(2)}. ` +
        (observacoes ? `Justificativa: ${observacoes.trim()}` : '')

      await fecharCaixa.mutateAsync({
        caixaId,
        valorInformado: totalInformado,
        observacoes: detalheObservacoes,
        dataFimFechamento: dataFimFechamento !== todayStr ? dataFimFechamento : undefined,
      })

      toast({
        title: 'Caixa fechado!',
        description: dataFimFechamento !== todayStr 
          ? `O caixa foi encerrado até o dia ${format(parseISO(dataFimFechamento), 'dd/MM/yyyy')}. Um novo caixa foi mantido aberto para as datas posteriores.`
          : 'O caixa foi encerrado com sucesso.',
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao fechar caixa',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {etapaConferencia ? 'Conferência de Fechamento' : 'Fechar Caixa'}
          </DialogTitle>
        </DialogHeader>

        {dataAbertura && (
          <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <Calendar className="h-3 w-3" />
            Caixa aberto em: {format(parseISO(dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        )}

        {!etapaConferencia ? (
          /* ETAPA 1: PREENCHIMENTO CEGO DAS FORMAS DE PAGAMENTO */
          <form onSubmit={handleAvancarParaConferencia} className="space-y-4 py-2 text-xs">
            <div className="space-y-2">
              <Label htmlFor="data_fim_fechamento" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Fechar Caixa Até Qual Data?
              </Label>
              <Input
                id="data_fim_fechamento"
                type="date"
                value={dataFimFechamento}
                max={todayStr}
                onChange={(e) => setDataFimFechamento(e.target.value)}
                className="h-10 rounded-lg border-border text-xs"
              />
            </div>

            {/* Listagem de pendências do dia, se houver */}
            {hasPendencias && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Atendimentos com Pagamento Pendente ({pendencias.length})
                </Label>
                <div className="max-h-[110px] overflow-y-auto border border-border rounded-lg bg-background">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-accent/50 text-muted-foreground border-b border-border font-semibold text-[9px] uppercase">
                        <th className="px-3 py-1.5">Cliente</th>
                        <th className="px-3 py-1.5">Serviço</th>
                        <th className="px-3 py-1.5 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendencias.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-1.5 font-semibold text-foreground truncate max-w-[120px]" title={p.cliente?.nome}>
                            {p.cliente?.nome}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[120px]" title={p.servico?.nome}>
                            {p.servico?.nome}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold text-foreground">
                            R$ {p.valor.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 space-y-2">
                  <div className="flex gap-2 items-center">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="font-semibold text-xs">Existem valores em aberto</p>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="confirmar_sem_baixa"
                      checked={confirmarSemBaixa}
                      onChange={(e) => setConfirmarSemBaixa(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-border bg-background mt-0.5"
                    />
                    <label htmlFor="confirmar_sem_baixa" className="text-[10px] font-semibold text-foreground cursor-pointer select-none">
                      Estou ciente de que existem valores em aberto e confirmo que desejo fechar o caixa sem dar baixa.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Campos por forma de pagamento (Fechamento Cego) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Conferência por Formas de Pagamento
                </span>
                <span className="text-[10px] text-muted-foreground">Informe os valores apurados</span>
              </div>

              {/* Dinheiro */}
              <div className="space-y-1">
                <Label htmlFor="val_dinheiro" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Dinheiro</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Notas e moedas na gaveta</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                  <Input
                    id="val_dinheiro"
                    placeholder="0,00"
                    value={valDinheiro}
                    onChange={(e) => setValDinheiro(formatarMoedaInput(e.target.value))}
                    className="h-9 pl-9 rounded-lg border-border text-xs font-bold"
                  />
                </div>
              </div>

              {/* PIX */}
              <div className="space-y-1">
                <Label htmlFor="val_pix" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>PIX</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Conferência no extrato bancário</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                  <Input
                    id="val_pix"
                    placeholder="0,00"
                    value={valPix}
                    onChange={(e) => setValPix(formatarMoedaInput(e.target.value))}
                    className="h-9 pl-9 rounded-lg border-border text-xs font-bold"
                  />
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-1">
                <Label htmlFor="val_credito" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Cartão de Crédito</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Relatório da maquininha</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                  <Input
                    id="val_credito"
                    placeholder="0,00"
                    value={valCartaoCredito}
                    onChange={(e) => setValCartaoCredito(formatarMoedaInput(e.target.value))}
                    className="h-9 pl-9 rounded-lg border-border text-xs font-bold"
                  />
                </div>
              </div>

              {/* Cartão de Débito */}
              <div className="space-y-1">
                <Label htmlFor="val_debito" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Cartão de Débito</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Relatório da maquininha</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                  <Input
                    id="val_debito"
                    placeholder="0,00"
                    value={valCartaoDebito}
                    onChange={(e) => setValCartaoDebito(formatarMoedaInput(e.target.value))}
                    className="h-9 pl-9 rounded-lg border-border text-xs font-bold"
                  />
                </div>
              </div>

              {/* Outros */}
              <div className="space-y-1">
                <Label htmlFor="val_outros" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Outros</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Outras formas de recebimento</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                  <Input
                    id="val_outros"
                    placeholder="0,00"
                    value={valOutros}
                    onChange={(e) => setValOutros(formatarMoedaInput(e.target.value))}
                    className="h-9 pl-9 rounded-lg border-border text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Totalizador Geral Somando Tudo o que Foi Informado */}
            <div className="p-3 bg-muted/60 rounded-xl border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Geral Informado
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Soma de todas as formas preenchidas
                </span>
              </div>
              <span className="text-base font-extrabold text-foreground tracking-tight">
                R$ {totalInformado.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs uppercase tracking-wider h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={fecharCaixa.isPending || (hasPendencias && !confirmarSemBaixa)}
                className="bg-primary text-primary-foreground text-xs uppercase tracking-wider h-9"
              >
                Conferir e Fechar Caixa
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* ETAPA 2: RESULTADO DA CONFERÊNCIA DE DIFERENÇAS (MOSTRANDO APENAS DIFERENÇAS) */
          <div className="space-y-4 py-2 text-xs">
            {diferencas.hasDivergencia ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="font-bold text-xs uppercase tracking-wider">Divergências Identificadas na Conferência</p>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                  O sistema identificou as seguintes diferenças entre a conferência física e o registro operacional. Por favor, analise as diferenças calculadas e informe a justificativa abaixo.
                </p>

                {/* Lista de Diferenças Calculadas (Apenas a diferença, sem exibir os totais do sistema) */}
                <div className="space-y-1.5 pt-1">
                  {Math.abs(diferencas.dinheiro) > 0.01 && (
                    <div className="flex justify-between items-center text-xs bg-background/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-semibold text-foreground">Dinheiro:</span>
                      <span className={`font-bold ${diferencas.dinheiro > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {diferencas.dinheiro > 0 ? `+ R$ ${diferencas.dinheiro.toFixed(2).replace('.', ',')} (Sobra)` : `- R$ ${Math.abs(diferencas.dinheiro).toFixed(2).replace('.', ',')} (Falta)`}
                      </span>
                    </div>
                  )}

                  {Math.abs(diferencas.pix) > 0.01 && (
                    <div className="flex justify-between items-center text-xs bg-background/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-semibold text-foreground">PIX:</span>
                      <span className={`font-bold ${diferencas.pix > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {diferencas.pix > 0 ? `+ R$ ${diferencas.pix.toFixed(2).replace('.', ',')} (Sobra)` : `- R$ ${Math.abs(diferencas.pix).toFixed(2).replace('.', ',')} (Falta)`}
                      </span>
                    </div>
                  )}

                  {Math.abs(diferencas.cartao_credito) > 0.01 && (
                    <div className="flex justify-between items-center text-xs bg-background/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-semibold text-foreground">Cartão de Crédito:</span>
                      <span className={`font-bold ${diferencas.cartao_credito > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {diferencas.cartao_credito > 0 ? `+ R$ ${diferencas.cartao_credito.toFixed(2).replace('.', ',')} (Sobra)` : `- R$ ${Math.abs(diferencas.cartao_credito).toFixed(2).replace('.', ',')} (Falta)`}
                      </span>
                    </div>
                  )}

                  {Math.abs(diferencas.cartao_debito) > 0.01 && (
                    <div className="flex justify-between items-center text-xs bg-background/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-semibold text-foreground">Cartão de Débito:</span>
                      <span className={`font-bold ${diferencas.cartao_debito > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {diferencas.cartao_debito > 0 ? `+ R$ ${diferencas.cartao_debito.toFixed(2).replace('.', ',')} (Sobra)` : `- R$ ${Math.abs(diferencas.cartao_debito).toFixed(2).replace('.', ',')} (Falta)`}
                      </span>
                    </div>
                  )}

                  {Math.abs(diferencas.outros) > 0.01 && (
                    <div className="flex justify-between items-center text-xs bg-background/80 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-semibold text-foreground">Outros:</span>
                      <span className={`font-bold ${diferencas.outros > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {diferencas.outros > 0 ? `+ R$ ${diferencas.outros.toFixed(2).replace('.', ',')} (Sobra)` : `- R$ ${Math.abs(diferencas.outros).toFixed(2).replace('.', ',')} (Falta)`}
                      </span>
                    </div>
                  )}

                  {/* Diferença Geral Total */}
                  <div className="flex justify-between items-center text-xs bg-background p-2.5 rounded-lg border border-border mt-2 font-bold">
                    <span>Diferença Geral Total:</span>
                    <span className={diferencas.total > 0 ? 'text-amber-600' : 'text-red-600'}>
                      {diferencas.total > 0 ? `+ R$ ${diferencas.total.toFixed(2).replace('.', ',')}` : `- R$ ${Math.abs(diferencas.total).toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-start gap-3 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">Conferência 100% Exata</p>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 mt-1 leading-relaxed">
                    Não foram encontradas divergências nas formas de pagamento informadas. O caixa está pronto para ser encerrado.
                  </p>
                </div>
              </div>
            )}

            {/* Campo de Justificativa / Observações Obrigatório em caso de divergência */}
            <div className="space-y-2">
              <Label htmlFor="obs_fechamento" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>{diferencas.hasDivergencia ? 'Justificativa Obrigatória da Divergência' : 'Observações de Fechamento (Opcional)'}</span>
                {diferencas.hasDivergencia && <span className="text-red-500 font-bold">* Obrigatório</span>}
              </Label>
              <Textarea
                id="obs_fechamento"
                placeholder={diferencas.hasDivergencia ? "Explique o motivo da sobra/falta apurada na conferência..." : "Observações gerais sobre este encerramento..."}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                required={diferencas.hasDivergencia}
                className="rounded-lg border-border text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapaConferencia(false)}
                className="text-xs uppercase tracking-wider h-9 gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar e Reconferir
              </Button>
              <Button
                type="button"
                onClick={handleFinalizarFechamento}
                disabled={fecharCaixa.isPending || (diferencas.hasDivergencia && (!observacoes || observacoes.trim().length < 5))}
                className="bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider h-9"
              >
                {fecharCaixa.isPending ? 'Encerrando...' : 'Confirmar Fechamento'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
