import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usuarioSchema, type UsuarioFormData } from '@/schemas/usuario.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useEffect } from 'react'
import { useCreateUsuario } from '@/hooks/useUsuarios'
import { useToast } from '@/hooks/use-toast'

interface UsuarioFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsuarioFormDialog({ open, onOpenChange }: UsuarioFormDialogProps) {
  const { toast } = useToast()
  const createUsuario = useCreateUsuario()

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      perfil: 'funcionario',
      senha: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        nome: '',
        email: '',
        perfil: 'funcionario',
        senha: '',
      })
    }
  }, [open, form])

  async function onSubmit(data: UsuarioFormData) {
    try {
      await createUsuario.mutateAsync({
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        senha: data.senha || '',
      })

      toast({
        title: 'Usuário cadastrado!',
        description: `${data.nome} foi adicionado com sucesso.`,
      })

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar usuário',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo funcionário ou administrador ao sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUsuario.isPending}>
                {createUsuario.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
