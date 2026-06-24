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
import { useCreateUsuario, useUpdateUsuario } from '@/hooks/useUsuarios'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database.types'

type Usuario = Database['public']['Tables']['usuario']['Row']

interface UsuarioFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: Usuario | null
}

export function UsuarioFormDialog({ open, onOpenChange, usuario }: UsuarioFormDialogProps) {
  const { toast } = useToast()
  const createUsuario = useCreateUsuario()
  const updateUsuario = useUpdateUsuario()

  const isEditing = !!usuario

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      perfil: 'profissional',
      senha: '',
      comissao_percentual: '0',
    },
  })

  useEffect(() => {
    if (open) {
      if (usuario) {
        form.reset({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil as any,
          senha: '',
          comissao_percentual: (usuario as any).comissao_percentual?.toString() || '0',
        })
      } else {
        form.reset({
          nome: '',
          email: '',
          perfil: 'profissional',
          senha: '',
          comissao_percentual: '0',
        })
      }
    }
  }, [open, usuario, form])

  async function onSubmit(data: UsuarioFormData) {
    try {
      if (isEditing) {
        // Prepare updates WITHOUT the password (passwords are handled by Auth, not the public table)
        const updates: any = {
          nome: data.nome,
          email: data.email,
          perfil: data.perfil,
          comissao_percentual: parseFloat(data.comissao_percentual?.replace(',', '.') || '0'),
        }

        await updateUsuario.mutateAsync({
          id: usuario.id,
          updates
        })

        // NOTE: Actually changing another user's password requires Admin API
        // which isn't safe to expose in the frontend directly.
        // We only update the public profile here.
        if (data.senha) {
          toast({
            title: 'Perfil atualizado',
            description: 'Dados salvos, mas a alteração de senha de terceiros requer permissões de administrador no painel do Supabase.',
          })
        } else {
          toast({
            title: 'Usuário atualizado!',
            description: `${data.nome} foi atualizado com sucesso.`,
          })
        }
      } else {
        await createUsuario.mutateAsync({
          nome: data.nome,
          email: data.email,
          perfil: data.perfil,
          comissao_percentual: parseFloat(data.comissao_percentual?.replace(',', '.') || '0'),
          senha: data.senha || '',
        })

        toast({
          title: 'Usuário cadastrado!',
          description: `${data.nome} foi adicionado com sucesso.`,
        })
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: isEditing ? 'Erro ao atualizar usuário' : 'Erro ao cadastrar usuário',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os dados e configurações do usuário.' 
              : 'Adicione um novo profissional ou administrador ao sistema.'}
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
                  <FormLabel>Senha {isEditing ? '(deixe em branco para manter)' : '*'}</FormLabel>
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
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comissao_percentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0" 
                      {...field} 
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          field.onChange('')
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          field.onChange('0')
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUsuario.isPending || updateUsuario.isPending}>
                {createUsuario.isPending || updateUsuario.isPending 
                  ? (isEditing ? 'Salvando...' : 'Cadastrando...') 
                  : (isEditing ? 'Salvar Alterações' : 'Cadastrar')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
