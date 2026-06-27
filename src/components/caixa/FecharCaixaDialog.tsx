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
import { useFecharCaixa } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { ClipboardCheck, AlertCircle, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento } from '@/types/models'

interface FecharCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caixaId: string
  saldoSistema: number
  dataAbertura?: string
  pendencias?: Agendamento[]
}

export function FecharCaixaDialog({
  open,
  onOpenChange,
  caixaId,
  saldoSistema,
  dataAbertura,
  pendencias = [],
}: FecharCaixaDialogProps) {
  const { toast } = useToast()
  const fecharCaixa = useFecharCaixa()
  const [valorInformado, setValorInformado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [confirmarSemBaixa, setConfirmarSemBaixa] = useState(false)

  const valorNum = Number(valorInformado.replace(',', '.'))
  const diferenca = !isNaN(valorNum) ? valorNum - saldoSistema : 0
  const hasPendencias = pendencias.length > 0

  useEffect(() => {
    if (open) {
      setConfirmarSemBaixa(false)
      setValorInformado('')
      setObservacoes('')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (hasPendencias && !confirmarSemBaixa) {
      toast({
        title: 'Confirmação pendente',
        description: 'Você precisa confirmar que deseja prosseguir sem realizar a baixa das pendências.',
        variant: 'destructive',
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
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Fechar Caixa
          </DialogTitle>
        </DialogHeader>
        {dataAbertura && (
          <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <Calendar className="h-3 w-3" />
            Caixa aberto em: {format(parseISO(dataAbertura), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Saldo do Sistema:</span>
              <span className="font-bold text-foreground">R$ {saldoSistema.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Diferença:</span>
              <span className={`font-bold ${diferenca === 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {diferenca.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Listagem de pendências do dia, se houver */}
          {hasPendencias && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Atendimentos com Pagamento Pendente ({pendencias.length})
              </Label>
              <div className="max-h-[120px] overflow-y-auto border border-border rounded-lg bg-background">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-accent/50 text-muted-foreground border-b border-border font-semibold text-[9px] uppercase">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Serviço</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendencias.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/10">
                        <td className="px-3 py-2 font-semibold text-foreground truncate max-w-[120px]" title={p.cliente?.nome}>
                          {p.cliente?.nome}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]" title={p.servico?.nome}>
                          {p.servico?.nome}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          R$ {p.valor.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alerta de confirmação obrigatório */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 space-y-2 leading-relaxed">
                <div className="flex gap-2 items-center">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="font-semibold text-xs">Existem valores em aberto</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Você pode optar por prosseguir com o fechamento do caixa sem realizar a baixa dessas pendências financeiras. Elas continuarão registradas como "Pendentes" e vinculadas ao cliente e a esta sessão de caixa.
                </p>
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

          <div className="space-y-2">
            <Label htmlFor="valor_informado" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Valor em Caixa (Dinheiro + Conferência)
            </Label>
            <Input
              id="valor_informado"
              placeholder="0,00"
              value={valorInformado}
              onChange={(e) => setValorInformado(e.target.value)}
              required
              className="h-10 rounded-lg border-border text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Informe o valor total físico conferido no caixa no momento do fechamento.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Observações de Fechamento
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Diferença de R$ 0,50 por erro de troco..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="rounded-lg border-border text-xs resize-none"
            />
          </div>

          {!hasPendencias && Math.abs(diferenca) > 0.01 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Atenção: Existe uma divergência entre o saldo do sistema e o valor informado.</p>
            </div>
          )}

          <DialogFooter className="gap-2">
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
              className="bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider h-9"
            >
              {fecharCaixa.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
