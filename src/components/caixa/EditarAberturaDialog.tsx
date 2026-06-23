import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateAberturaCaixa } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface EditarAberturaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transacaoId: string | null
  valorAtual: number
}

export function EditarAberturaDialog({
  open,
  onOpenChange,
  transacaoId,
  valorAtual,
}: EditarAberturaDialogProps) {
  const [valor, setValor] = useState(valorAtual)
  const updateAbertura = useUpdateAberturaCaixa()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setValor(valorAtual)
    }
  }, [open, valorAtual])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transacaoId) return

    try {
      await updateAbertura.mutateAsync({ transacaoId, novoValor: valor })
      toast({
        title: 'Saldo de abertura atualizado!',
        description: 'O valor foi corrigido e os saldos foram recalculados com sucesso.',
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar saldo',
        description: error.message,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-border bg-background">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold uppercase tracking-wider">Editar Saldo Inicial</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Corrija o saldo de abertura do caixa. Todos os relatórios e saldos do dia serão recalculados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-xs">
            <div className="grid gap-2">
              <Label htmlFor="valor" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Valor Inicial (R$)
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="h-10 rounded-lg border-border bg-background text-xs"
              />
            </div>
          </div>
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
              disabled={updateAbertura.isPending}
              className="text-xs uppercase tracking-wider h-9"
            >
              {updateAbertura.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alteração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
