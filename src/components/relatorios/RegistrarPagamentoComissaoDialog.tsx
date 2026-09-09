import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useProfissionais } from '@/hooks/useProfissionais'
import { relatoriosService } from '@/services/relatorios.service'
import { useQueryClient } from '@tanstack/react-query'
import { DollarSign, ShieldCheck, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface RegistrarPagamentoComissaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProfissionalId?: string
  defaultValor?: string
  saldoPendenteAtual?: number
  onSuccess?: () => void
}

export function RegistrarPagamentoComissaoDialog({
  open,
  onOpenChange,
  defaultProfissionalId,
  defaultValor,
  saldoPendenteAtual = 0,
  onSuccess,
}: RegistrarPagamentoComissaoDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthStore()
  const { data: profissionais = [] } = useProfissionais()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('')
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'transferencia' | 'dinheiro' | 'outros'>('pix')
  const [dataPagamento, setDataPagamento] = useState(todayStr)
  const [observacoes, setObservacoes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedProfissionalId(defaultProfissionalId || '')
      setValor(defaultValor || '')
      setFormaPagamento('pix')
      setDataPagamento(format(new Date(), 'yyyy-MM-dd'))
      setObservacoes('')
      setIsSubmitting(false)
    }
  }, [open, defaultProfissionalId, defaultValor])

  const profSelecionado = profissionais.find((p) => p.id === selectedProfissionalId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem registrar repasses de comissão.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedProfissionalId) {
      toast({
        title: 'Selecione um profissional',
        description: 'Por favor, selecione o profissional que está recebendo a comissão.',
        variant: 'destructive',
      })
      return
    }

    const cleanValue = valor.replace(/[^\d.,]/g, '').replace(',', '.')
    const valorNum = Math.abs(Number(cleanValue))

    if (isNaN(valorNum) || valorNum <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero para o pagamento.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Ajusta para o final do dia ou momento selecionado mantendo fuso
      const [year, month, day] = dataPagamento.split('-').map(Number)
      const dataHoraFinal = new Date(year, month - 1, day, 12, 0, 0).toISOString()

      await relatoriosService.registrarPagamentoComissao({
        profissional_id: selectedProfissionalId,
        valor: valorNum,
        forma_pagamento: formaPagamento,
        data_pagamento: dataHoraFinal,
        observacoes: observacoes.trim() || undefined,
      })

      toast({
        title: 'Pagamento registrado!',
        description: `O repasse de R$ ${valorNum.toFixed(2).replace('.', ',')} para ${profSelecionado?.nome || 'o profissional'} foi registrado com sucesso.`,
      })

      queryClient.invalidateQueries({ queryKey: ['saldos-comissoes-report'] })
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento-report'] })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message || 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            <DollarSign className="h-5 w-5 text-violet-600" />
            Registrar Pagamento de Comissão
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Aviso informativo de independência do caixa */}
          <div className="flex items-start gap-2.5 bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-200 p-3 rounded-lg border border-violet-200 dark:border-violet-900/30 text-[11px] leading-relaxed">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-violet-600 mt-0.5" />
            <p>
              Este registro é exclusivo da gestão de comissões e <strong>NÃO incide sobre o caixa diário</strong> da recepção. Ele quita o saldo pendente do profissional sem alterar o saldo da gaveta.
            </p>
          </div>

          {/* Seleção do Profissional */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Profissional <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedProfissionalId}
              onValueChange={setSelectedProfissionalId}
              disabled={!!defaultProfissionalId}
            >
              <SelectTrigger className="h-9 text-xs border-border">
                <SelectValue placeholder="Selecione o profissional..." />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Saldo Pendente Informativo */}
          {saldoPendenteAtual > 0 && (
            <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-lg border border-border text-xs">
              <span className="text-muted-foreground font-medium">Saldo Pendente Atual:</span>
              <span className="font-bold text-violet-600 dark:text-violet-400">
                R$ {saldoPendenteAtual.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Grid de Valor e Forma de Repasse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valor_pagamento" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Valor a Pagar (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valor_pagamento"
                type="text"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-9 text-xs border-border font-semibold text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Forma de Repasse <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formaPagamento}
                onValueChange={(val) => setFormaPagamento(val as any)}
              >
                <SelectTrigger className="h-9 text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro (fora do caixa)</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data do Pagamento */}
          <div className="space-y-1.5">
            <Label htmlFor="data_pagamento" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data do Pagamento
            </Label>
            <Input
              id="data_pagamento"
              type="date"
              value={dataPagamento}
              max={todayStr}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="h-9 text-xs border-border"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="observacoes" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Observações / Comprovante (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Chave PIX CPF, adiantamento da 1ª quinzena..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="text-xs border-border resize-none h-16"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs border-border"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
