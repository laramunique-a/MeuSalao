import { useState } from 'react'
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
import { useFecharCaixa } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { ClipboardCheck, AlertCircle, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FecharCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caixaId: string
  saldoSistema: number
  dataAbertura?: string
  hasPendencias?: boolean
}

export function FecharCaixaDialog({ open, onOpenChange, caixaId, saldoSistema, dataAbertura, hasPendencias }: FecharCaixaDialogProps) {
  const { toast } = useToast()
  const fecharCaixa = useFecharCaixa()
  const [valorInformado, setValorInformado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const valorNum = Number(valorInformado.replace(',', '.'))
  const diferenca = !isNaN(valorNum) ? valorNum - saldoSistema : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (hasPendencias) {
      toast({
        title: "Não é possível fechar o caixa",
        description: "Não é possível fechar o caixa com pendências a receber. Por favor, processe todos os recebimento antes de fechar",
        variant: "destructive",
      })
      return
    }

    if (isNaN(valorNum)) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, informe um valor de fechamento válido.',
        variant: 'destructive',
      })
      return
    }

    try {
      await fecharCaixa.mutateAsync({
        caixaId,
        valorInformado: valorNum,
        observacoes,
      })
      toast({
        title: 'Caixa fechado!',
        description: 'O caixa foi encerrado com sucesso.',
      })
      onOpenChange(false)
      setValorInformado('')
      setObservacoes('')
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Fechar Caixa
          </DialogTitle>
        </DialogHeader>
        {dataAbertura && (
          <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground font-medium">
            <Calendar className="h-3 w-3" />
            Caixa aberto em: {format(parseISO(dataAbertura), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo do Sistema:</span>
              <span className="font-bold">R$ {saldoSistema.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diferença:</span>
              <span className={`font-bold ${diferenca === 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {diferenca.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_informado">Valor em Caixa (Dinheiro + Conferência)</Label>
            <Input
              id="valor_informado"
              placeholder="0,00"
              value={valorInformado}
              onChange={(e) => setValorInformado(e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Informe o valor total físico conferido no caixa no momento do fechamento.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações de Fechamento</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Diferença de R$ 0,50 por erro de troco..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {Math.abs(diferenca) > 0.01 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Atenção: Existe uma divergência entre o saldo do sistema e o valor informado.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={fecharCaixa.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {fecharCaixa.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
