import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
  FormMessage,
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
import { useToast } from '@/hooks/use-toast'
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const darBaixaSchema = z.object({
  forma_pagamento: z.enum(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'outros']),
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

export function DarBaixaDialog({ open, onOpenChange, agendamento }: DarBaixaDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()
  const updateStatus = useUpdateAgendamentoStatus()

  const form = useForm<DarBaixaFormData>({
    resolver: zodResolver(darBaixaSchema),
    defaultValues: {
      forma_pagamento: 'dinheiro',
    },
  })

  async function onSubmit(data: DarBaixaFormData) {
    if (!agendamento) return

    try {
      await createTransacao.mutateAsync({
        agendamento_id: agendamento.id,
        tipo: 'entrada',
        valor: agendamento.valor,
        forma_pagamento: data.forma_pagamento,
        categoria: 'Serviço',
        descricao: `${agendamento.servico?.nome} - ${agendamento.cliente?.nome}`,
        data_hora: new Date().toISOString(),
      })

      await updateStatus.mutateAsync({
        id: agendamento.id,
        status: 'concluido',
      })

      toast({
        title: 'Baixa realizada!',
        description: `Pagamento de R$ ${agendamento.valor.toFixed(2).replace('.', ',')} registrado com sucesso.`,
      })

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (!agendamento) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Dar Baixa no Atendimento</DialogTitle>
          <DialogDescription>
            Registre o pagamento do atendimento para fechar no caixa.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
          <p><strong>Cliente:</strong> {agendamento.cliente?.nome}</p>
          <p><strong>Serviço:</strong> {agendamento.servico?.nome}</p>
          <p><strong>Profissional:</strong> {agendamento.profissional?.nome}</p>
          <p><strong>Horário:</strong> {format(new Date(agendamento.data_hora), "HH:mm 'de' dd/MM/yyyy", { locale: ptBR })}</p>
          <p className="text-lg font-bold text-primary pt-1">
            R$ {agendamento.valor.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="forma_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((fp) => (
                        <SelectItem key={fp.value} value={fp.value}>
                          {fp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTransacao.isPending || updateStatus.isPending}
              >
                {createTransacao.isPending || updateStatus.isPending
                  ? 'Registrando...'
                  : 'Confirmar Pagamento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
