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
import { useCreateTransacao } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { MoveDown, MoveUp, ShieldAlert, SlidersHorizontal, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProfissionais } from '@/hooks/useProfissionais'

interface MovimentacaoManualDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TipoMovimento = 'entrada' | 'saida' | 'retirada' | 'ajuste' | 'comissao'
type SubTipoAjuste = 'positivo' | 'negativo'

export function MovimentacaoManualDialog({ open, onOpenChange }: MovimentacaoManualDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()
  const { isAdmin } = useAuthStore()
  const { data: profissionais = [] } = useProfissionais()
  
  const [tipoMovimento, setTipoMovimento] = useState<TipoMovimento>('entrada')
  const [subTipoAjuste, setSubTipoAjuste] = useState<SubTipoAjuste>('positivo')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('')
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix'>('dinheiro')

  useEffect(() => {
    if (open) {
      setTipoMovimento('entrada')
      setSubTipoAjuste('positivo')
      setValor('')
      setDescricao('')
      setSelectedProfissionalId('')
      setFormaPagamento('dinheiro')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if ((tipoMovimento === 'saida' || tipoMovimento === 'retirada' || tipoMovimento === 'ajuste' || tipoMovimento === 'comissao') && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem registrar esse tipo de movimentação.',
        variant: 'destructive',
      })
      return
    }

    if (tipoMovimento === 'comissao' && !selectedProfissionalId) {
      toast({
        title: 'Profissional não selecionado',
        description: 'Por favor, selecione o profissional que está recebendo a comissão.',
        variant: 'destructive',
      })
      return
    }

    // Convert value to absolute float
    const cleanValue = valor.replace(/[^\d.,]/g, '').replace(',', '.')
    const valorNum = Math.abs(Number(cleanValue))

    if (valorNum <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'O valor da movimentação deve ser maior que zero.',
        variant: 'destructive',
      })
      return
    }

    // Determine absolute DB type and final category
    let dbTipo: 'entrada' | 'saida' = 'entrada'
    let finalCategoria = ''

    switch (tipoMovimento) {
      case 'entrada':
        dbTipo = 'entrada'
        finalCategoria = 'Entrada Manual'
        break
      case 'saida':
        dbTipo = 'saida'
        finalCategoria = 'Saída Manual'
        break
      case 'retirada':
        dbTipo = 'saida'
        finalCategoria = 'Retirada de Caixa' // Forte compliance visível
        break
      case 'ajuste':
        dbTipo = subTipoAjuste === 'positivo' ? 'entrada' : 'saida'
        finalCategoria = 'Ajuste de Caixa' // Forte compliance visível
        break
      case 'comissao':
        dbTipo = 'saida'
        finalCategoria = 'Pagamento de Comissão'
        break
    }

    const prof = profissionais.find(p => p.id === selectedProfissionalId)
    const profName = prof ? prof.nome : ''
    
    const finalDescricao = tipoMovimento === 'comissao'
      ? `Comissão: ${profName}${descricao ? ` - ${descricao}` : ''}`
      : descricao

    const metadata = tipoMovimento === 'comissao' && selectedProfissionalId
      ? { profissional_id: selectedProfissionalId, profissional_nome: profName }
      : undefined

    try {
      await createTransacao.mutateAsync({
        tipo: dbTipo,
        valor: valorNum,
        descricao: finalDescricao,
        categoria: finalCategoria,
        forma_pagamento: tipoMovimento === 'ajuste' ? 'dinheiro' : (tipoMovimento === 'retirada' ? 'dinheiro' : formaPagamento),
        data_hora: new Date().toISOString(),
        status: 'ativo',
        agendamento_id: null,
        caixa_id: null, // Será preenchido pelo service
        metadata: metadata as any
      })
      toast({
        title: 'Movimentação registrada!',
        description: `A movimentação de R$ ${valorNum.toFixed(2)} foi concluída com sucesso.`,
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar movimentação',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  // UI Helpers
  const getHeaderInfo = () => {
    switch (tipoMovimento) {
      case 'entrada': return { icon: <MoveUp className="h-5 w-5 text-emerald-600" />, title: 'Nova Entrada', color: 'text-emerald-600' }
      case 'saida': return { icon: <MoveDown className="h-5 w-5 text-rose-600" />, title: 'Nova Saída', color: 'text-rose-600' }
      case 'retirada': return { icon: <ShieldAlert className="h-5 w-5 text-amber-600" />, title: 'Retirada de Caixa', color: 'text-amber-600' }
      case 'ajuste': return { icon: <SlidersHorizontal className="h-5 w-5 text-yellow-600" />, title: 'Ajuste de Caixa', color: 'text-yellow-600' }
      case 'comissao': return { icon: <User className="h-5 w-5 text-rose-600" />, title: 'Pagamento de Comissão', color: 'text-rose-600' }
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {headerInfo.icon}
            <span className={headerInfo.color}>{headerInfo.title}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          {/* Tipo de Movimentação */}
          <div className="space-y-2">
            <Label>Tipo de movimentação <span className="text-rose-500">*</span></Label>
            <Select value={tipoMovimento} onValueChange={(val) => setTipoMovimento(val as TipoMovimento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                {isAdmin && <SelectItem value="saida">Saída</SelectItem>}
                {isAdmin && <SelectItem value="comissao">Pagamento de Comissão</SelectItem>}
                {isAdmin && <SelectItem value="retirada">Retirada de Caixa</SelectItem>}
                {isAdmin && <SelectItem value="ajuste">Ajuste de Caixa</SelectItem>}
              </SelectContent>
            </Select>

            {/* Explicação de Apoio */}
            <div className="text-[11px] text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-100">
              {tipoMovimento === 'entrada' && "Utilize para registrar valores que entraram no caixa (receitas)."}
              {tipoMovimento === 'saida' && "Utilize para registrar pagamentos ou despesas gerais do salão."}
              {tipoMovimento === 'comissao' && "Utilize para registrar saídas referentes a pagamentos de comissões aos profissionais."}
              {tipoMovimento === 'retirada' && "Utilize quando retirar dinheiro do caixa por segurança. Não é considerado despesa contábil."}
              {tipoMovimento === 'ajuste' && "Utilize para corrigir diferenças de valores no caixa (positivas ou negativas)."}
            </div>
          </div>

          {/* Seletor do Profissional (apenas para comissao) */}
          {tipoMovimento === 'comissao' && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Profissional <span className="text-rose-500">*</span></Label>
              <Select value={selectedProfissionalId} onValueChange={setSelectedProfissionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional..." />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Forma de Pagamento */}
          {(tipoMovimento === 'entrada' || tipoMovimento === 'saida' || tipoMovimento === 'comissao') && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Forma de Pagamento <span className="text-rose-500">*</span></Label>
              <Select value={formaPagamento} onValueChange={(val) => setFormaPagamento(val as 'dinheiro' | 'pix')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seletor Subtipo de Ajuste */}
          {tipoMovimento === 'ajuste' && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Tipo de Ajuste <span className="text-rose-500">*</span></Label>
              <Select value={subTipoAjuste} onValueChange={(val) => setSubTipoAjuste(val as SubTipoAjuste)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positivo">Ajuste Positivo (Soma no caixa)</SelectItem>
                  <SelectItem value="negativo">Ajuste Negativo (Subtrai do caixa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Label htmlFor="valor">Valor (R$) <span className="text-rose-500">*</span></Label>
            <Input
              id="valor"
              placeholder="0,00"
              value={valor}
              onChange={(e) => {
                // Allows only positive numbers and commas/dots
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setValor(val)
              }}
              required
            />
            {tipoMovimento === 'ajuste' && (
              <p className="text-[10px] text-muted-foreground ml-1">
                Informe o valor positivamente. O sistema aplicará a soma ou subtração automaticamente.
              </p>
            )}
          </div>

          {/* Categoria foi removida a pedido do usuário, agora gerada automaticamente pelo backend/UI */}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição / Motivo <span className="text-muted-foreground font-normal text-xs">(Recomendado)</span></Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o motivo detalhado desta movimentação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createTransacao.isPending}>
              {createTransacao.isPending ? 'Salvando...' : 'Confirmar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
