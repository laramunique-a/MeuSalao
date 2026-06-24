import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Scissors } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao MeuSalão',
      })
      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais e tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <Card className="w-full max-w-sm border-none bg-card shadow-2xl rounded-3xl p-3">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-accent text-foreground rounded-2xl shadow-sm border border-border/10">
              <Scissors className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-center tracking-tight text-foreground">MeuSalão</CardTitle>
          <CardDescription className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-1">
            Sistema de Gestão 3D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="rounded-xl border-border bg-background/50 h-10 px-3 text-xs"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="rounded-xl border-border bg-background/50 h-10 px-3 text-xs"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-11 text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all bg-primary text-primary-foreground mt-2" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Acessar Painel'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
