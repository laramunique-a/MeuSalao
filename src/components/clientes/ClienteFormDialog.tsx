import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormData } from '@/schemas/cliente.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import InputMask from 'react-input-mask'
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
import { useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import type { Cliente } from '@/types/models'

interface ClienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
  onSuccess?: (cliente: Cliente) => void
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}: ClienteFormDialogProps) {
  const { toast } = useToast()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (cliente) {
      form.reset({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || '',
        observacoes: cliente.observacoes || '',
      })
    } else {
      form.reset({
        nome: '',
        telefone: '',
        email: '',
        observacoes: '',
      })
    }
  }, [cliente, form, open])

  async function onSubmit(data: ClienteFormData) {
    try {
      if (cliente && cliente.id) {
        const result = await updateCliente.mutateAsync({
          id: cliente.id,
          data: {
            nome: data.nome,
            telefone: data.telefone,
            email: data.email || null,
            observacoes: data.observacoes || null,
          },
        })
        toast({
          title: 'Cliente atualizado!',
          description: 'Os dados do cliente foram atualizados com sucesso.',
        })
        if (onSuccess) onSuccess(result as unknown as Cliente)
      } else {
        const result = await createCliente.mutateAsync({
          nome: data.nome,
          telefone: data.telefone,
          email: data.email || null,
          observacoes: data.observacoes || null,
        })
        toast({
          title: 'Cliente cadastrado!',
          description: 'O cliente foi adicionado com sucesso.',
        })
        if (onSuccess) onSuccess(result as unknown as Cliente)
      }
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {cliente
              ? 'Edite as informações do cliente abaixo.'
              : 'Preencha os dados do novo cliente.'}
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
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <InputMask
                      mask="(99) 99999-9999"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(inputProps: any) => (
                        <Input placeholder="(11) 98765-4321" {...inputProps} />
                      )}
                    </InputMask>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o cliente..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                disabled={createCliente.isPending || updateCliente.isPending}
              >
                {createCliente.isPending || updateCliente.isPending
                  ? 'Salvando...'
                  : cliente
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
