import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usuarioSchema, type UsuarioFormData } from '@/schemas/usuario.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { CalendarCheck } from 'lucide-react'
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
      pode_atender: true,
      senha: '',
      comissao_percentual: '0',
    },
  })

  const perfilAtual = form.watch('perfil')
  const isAdmin = perfilAtual === 'administrador'

  useEffect(() => {
    if (open) {
      if (usuario) {
        form.reset({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil as any,
          pode_atender: (usuario as any).pode_atender ?? (usuario.perfil === 'profissional'),
          senha: '',
          comissao_percentual: (usuario as any).comissao_percentual?.toString() || '0',
        })
      } else {
        form.reset({
          nome: '',
          email: '',
          perfil: 'profissional',
          pode_atender: true,
          senha: '',
          comissao_percentual: '0',
        })
      }
    }
  }, [open, usuario, form])

  // Quando muda para profissional, força pode_atender = true
  useEffect(() => {
    if (perfilAtual === 'profissional') {
      form.setValue('pode_atender', true)
    }
  }, [perfilAtual, form])

  async function onSubmit(data: UsuarioFormData) {
    // profissional sempre pode atender
    const podeAtender = data.perfil === 'profissional' ? true : data.pode_atender

    try {
      if (isEditing) {
        const updates: any = {
          nome: data.nome,
          email: data.email,
          perfil: data.perfil,
          pode_atender: podeAtender,
          comissao_percentual: parseFloat(data.comissao_percentual?.replace(',', '.') || '0'),
        }

        await updateUsuario.mutateAsync({
          id: usuario.id,
          updates
        })

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
          pode_atender: podeAtender,
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

            {/* Toggle: visível apenas quando perfil = administrador */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="pode_atender"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/5 p-3">
                      <CalendarCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <FormLabel className="text-sm font-semibold text-foreground cursor-pointer">
                          Pode realizar atendimentos
                        </FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Permite que este administrador apareça na agenda e receba comissões como profissional
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
