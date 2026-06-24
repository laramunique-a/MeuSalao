import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { KeyRound } from 'lucide-react'

const schema = z.object({
  senhaAtual: z.string().min(1, 'A senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
})

type FormData = z.infer<typeof schema>

interface AlterarSenhaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlterarSenhaDialog({ open, onOpenChange }: AlterarSenhaDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!user?.email) return
    
    setLoading(true)
    try {
      // Verifica a senha atual
      try {
        await authService.verifyCredentials(user.email, data.senhaAtual)
      } catch (err: any) {
        form.setError('senhaAtual', { message: 'Senha atual incorreta' })
        setLoading(false)
        return
      }

      // Atualiza para a nova senha
      await authService.updatePassword(data.novaSenha)

      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Sua senha foi atualizada. Lembre-se dela no próximo login.',
      })
      
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) form.reset()
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Altere sua senha de acesso ao sistema. A nova senha deve ter no mínimo 6 caracteres.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="senhaAtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="novaSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
