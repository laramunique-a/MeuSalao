import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useCreateTransacao } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { DollarSign } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface PagarComissaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profissionalId: string
  profissionalNome?: string
  saldoPendente: number
  onSuccess?: () => void
}

const FORMAS_PAGAMENTO_COMISSAO = [
  { value: 'pix', label: 'PIX (Transferência)' },
  { value: 'dinheiro', label: 'Dinheiro (Fora do Caixa Diário)' },
  { value: 'cartao_debito', label: 'Transferência Bancária / Débito' },
  { value: 'outros', label: 'Outros' },
]

export function PagarComissaoDialog({
  open,
  onOpenChange,
  profissionalId,
  profissionalNome = 'Profissional',
  saldoPendente,
  onSuccess,
}: PagarComissaoDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()
  const { isAdmin } = useAuthStore()

  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (open) {
      const valorInicial = saldoPendente > 0 ? saldoPendente.toFixed(2).replace('.', ',') : ''
      setValor(valorInicial)
      setFormaPagamento('pix')
      setObservacoes('')
    }
  }, [open, saldoPendente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem registrar pagamento de comissões.',
        variant: 'destructive',
      })
      return
    }

    const cleanValue = valor.replace(/[^\d.,]/g, '').replace(',', '.')
    const valorNum = Math.abs(Number(cleanValue))

    if (isNaN(valorNum) || valorNum <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, informe um valor válido maior que zero.',
        variant: 'destructive',
      })
      return
    }

    try {
      await createTransacao.mutateAsync({
        tipo: 'saida',
        valor: valorNum,
        forma_pagamento: formaPagamento as any,
        categoria: 'Pagamento de Comissão',
        descricao: `Comissão: ${profissionalNome}${observacoes ? ` - ${observacoes.trim()}` : ''}`,
        status: 'ativo',
        data_hora: new Date().toISOString(),
        agendamento_id: null,
        caixa_id: null, // Desvinculado do caixa diário da recepção
        metadata: {
          profissional_id: profissionalId,
          profissional_nome: profissionalNome,
          tipo_registro: 'pagamento_comissao_independente',
          observacoes: observacoes.trim(),
        } as any,
      })

      toast({
        title: 'Comissão registrada!',
        description: `Pagamento de R$ ${valorNum.toFixed(2).replace('.', ',')} para ${profissionalNome} registrado com sucesso.`,
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Pagar Comissão
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Este pagamento será registrado na folha do profissional sem alterar o saldo físico do caixa da recepção.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Card do Profissional e Saldo */}
          <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                {profissionalNome.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-foreground uppercase tracking-wide">{profissionalNome}</p>
                <p className="text-[10px] text-muted-foreground">Saldo Pendente</p>
              </div>
            </div>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              R$ {saldoPendente.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Valor a Pagar */}
          <div className="space-y-1.5">
            <Label htmlFor="valor_comissao" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Valor a Pagar (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
              <Input
                id="valor_comissao"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="h-10 pl-9 rounded-lg border-border text-xs font-bold"
              />
            </div>
          </div>

          {/* Método Utilizado */}
          <div className="space-y-1.5">
            <Label htmlFor="forma_pagamento" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Forma de Pagamento
            </Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger id="forma_pagamento" className="h-10 border-border text-xs">
                <SelectValue placeholder="Selecione a forma..." />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO_COMISSAO.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações / Comprovante */}
          <div className="space-y-1.5">
            <Label htmlFor="obs_comissao" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Observações / Comprovante (Opcional)
            </Label>
            <Textarea
              id="obs_comissao"
              placeholder="Ex: Pago via PIX pelo banco Nubank, ref. 1ª quinzena..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="rounded-lg border-border text-xs resize-none"
            />
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
              disabled={createTransacao.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-wider h-9"
            >
              {createTransacao.isPending ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
