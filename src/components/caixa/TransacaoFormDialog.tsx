import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transacaoSchema, type TransacaoFormData } from '@/schemas/transacao.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateTransacao } from '@/hooks/useCaixa'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import { FORMAS_PAGAMENTO_LABELS } from '@/lib/constants'

interface TransacaoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransacaoFormDialog({ open, onOpenChange }: TransacaoFormDialogProps) {
  const { toast } = useToast()
  const createTransacao = useCreateTransacao()

  const form = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: 'entrada',
      valor: '',
      forma_pagamento: 'dinheiro',
      categoria: '',
      descricao: '',
      data_hora: new Date().toISOString().slice(0, 16),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: 'entrada',
        valor: '',
        forma_pagamento: 'dinheiro',
        categoria: '',
        descricao: '',
        data_hora: new Date().toISOString().slice(0, 16),
      })
    }
  }, [open, form])

  async function onSubmit(data: TransacaoFormData) {
    try {
      await createTransacao.mutateAsync({
        tipo: data.tipo,
        valor: parseFloat(data.valor),
        forma_pagamento: data.forma_pagamento,
        categoria: data.categoria || null,
        descricao: data.descricao,
        data_hora: data.data_hora || new Date().toISOString(),
        agendamento_id: data.agendamento_id || null,
      })

      toast({
        title: 'Transação registrada!',
        description: `${data.tipo === 'entrada' ? 'Entrada' : 'Saída'} de R$ ${parseFloat(
          data.valor
        ).toFixed(2)} registrada com sucesso.`,
      })

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar transação',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const tipoTransacao = form.watch('tipo')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída do caixa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                      <SelectItem value="saida">Saída (Despesa)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="forma_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FORMAS_PAGAMENTO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tipoTransacao === 'entrada' ? 'Ex: Serviço' : 'Ex: Material, Aluguel'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a transação..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTransacao.isPending}>
                {createTransacao.isPending ? 'Registrando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
