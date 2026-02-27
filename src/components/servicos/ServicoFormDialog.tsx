import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { servicoSchema, type ServicoFormData } from '@/schemas/servico.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCreateServico, useUpdateServico } from '@/hooks/useServicos'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import type { Servico } from '@/types/models'

interface ServicoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico?: Servico | null
}

export function ServicoFormDialog({ open, onOpenChange, servico }: ServicoFormDialogProps) {
  const { toast } = useToast()
  const createServico = useCreateServico()
  const updateServico = useUpdateServico()

  const form = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      valor: '',
      duracao_minutos: '',
      ativo: true,
    },
  })

  useEffect(() => {
    if (servico) {
      form.reset({
        nome: servico.nome,
        descricao: servico.descricao || '',
        valor: servico.valor.toFixed(2).replace('.', ','),
        duracao_minutos: servico.duracao_minutos.toString(),
        ativo: servico.ativo,
      })
    } else {
      form.reset({
        nome: '',
        descricao: '',
        valor: '',
        duracao_minutos: '',
        ativo: true,
      })
    }
  }, [servico, form, open])

  async function onSubmit(data: ServicoFormData) {
    try {
      const servicoData = {
        nome: data.nome,
        descricao: data.descricao || null,
        valor: parseFloat(data.valor.replace(',', '.')),
        duracao_minutos: parseInt(data.duracao_minutos),
        ativo: data.ativo,
      }

      if (servico) {
        await updateServico.mutateAsync({
          id: servico.id,
          data: servicoData,
        })
        toast({
          title: 'Serviço atualizado!',
          description: 'Os dados do serviço foram atualizados com sucesso.',
        })
      } else {
        await createServico.mutateAsync(servicoData)
        toast({
          title: 'Serviço cadastrado!',
          description: 'O serviço foi adicionado com sucesso.',
        })
      }
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar serviço',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{servico ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          <DialogDescription>
            {servico
              ? 'Edite as informações do serviço abaixo.'
              : 'Preencha os dados do novo serviço.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corte de Cabelo" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do serviço..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <CurrencyInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracao_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Serviço Ativo
                    </FormLabel>
                    <FormDescription>
                      Serviços inativos não aparecerão na agenda
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createServico.isPending || updateServico.isPending}
              >
                {createServico.isPending || updateServico.isPending
                  ? 'Salvando...'
                  : servico
                    ? 'Atualizar'
                    : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
