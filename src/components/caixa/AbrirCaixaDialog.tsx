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
import { useAbrirCaixa, useLastClosedCaixa } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, History } from 'lucide-react'

interface AbrirCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AbrirCaixaDialog({ open, onOpenChange }: AbrirCaixaDialogProps) {
  const { toast } = useToast()
  const abrirCaixa = useAbrirCaixa()
  const { data: lastClosed } = useLastClosedCaixa()

  const [suggestedValue, setSuggestedValue] = useState<number | null>(null)
  // manualInput: what the user actually types — starts empty
  const [manualInput, setManualInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (open) {
      const raw = lastClosed?.valor_fechamento_informado
      setSuggestedValue(raw != null ? Number(raw) : null)
      setManualInput('')
      setIsFocused(false)
      setObservacoes('')
    }
  }, [open, lastClosed])

  // Normalize: append ,00 if user typed only an integer
  const normalizeValue = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return ''
    return trimmed.includes(',') ? trimmed : trimmed + ',00'
  }

  // Auto-format visually on blur
  const handleBlur = () => {
    setIsFocused(false)
    const normalized = normalizeValue(manualInput)
    if (normalized) setManualInput(normalized)
  }

  // The effective placeholder: suggestion formatted or "0,00"
  const placeholder =
    suggestedValue != null
      ? suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0,00'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let effectiveValue: number
    if (!manualInput.trim() && suggestedValue != null) {
      // User didn't type anything → use the suggestion
      effectiveValue = suggestedValue
    } else {
      const normalized = normalizeValue(manualInput)
      // Remove thousand separators (dots) before replacing decimal comma
      effectiveValue = Number(normalized.replace(/\./g, '').replace(',', '.'))
    }

    if (isNaN(effectiveValue) || effectiveValue < 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, informe um valor inicial válido.',
        variant: 'destructive',
      })
      return
    }

    try {
      await abrirCaixa.mutateAsync({ valorInicial: effectiveValue, observacoes })
      toast({ title: 'Caixa aberto!', description: 'O caixa foi aberto com sucesso.' })
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro ao abrir caixa', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Abrir Caixa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor_inicial">Valor Inicial / Troco (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="valor_inicial"
                placeholder={isFocused ? '' : placeholder}
                value={manualInput}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setManualInput(e.target.value)}
                onBlur={handleBlur}
                className="pl-9"
              />
            </div>
            {suggestedValue != null && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="h-3 w-3" />
                Sugerido com base no fechamento anterior. Deixe em branco para aceitar.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Troco inicial em moedas..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={abrirCaixa.isPending}>
              {abrirCaixa.isPending ? 'Abrindo...' : 'Confirmar Abertura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
