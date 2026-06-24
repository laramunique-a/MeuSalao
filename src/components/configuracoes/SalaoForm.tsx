import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { salaoSchema, type SalaoFormData } from '@/schemas/salao.schema'
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
import { Card, CardContent } from '@/components/ui/card'
import { useUpdateSalao } from '@/hooks/useSalao'
import { useToast } from '@/hooks/use-toast'
import { Store, MapPin, Loader2, Save } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Salao } from '@/types/models'

interface SalaoFormProps {
  salao: Salao
}

export function SalaoForm({ salao }: SalaoFormProps) {
  const { toast } = useToast()
  const updateSalao = useUpdateSalao()
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const form = useForm<SalaoFormData>({
    resolver: zodResolver(salaoSchema),
    defaultValues: {
      nome: salao.nome,
      cnpj: salao.cnpj || '',
      telefone: salao.telefone || '',
      cep: salao.cep || '',
      logradouro: salao.logradouro || '',
      numero: salao.numero || '',
      complemento: salao.complemento || '',
      bairro: salao.bairro || '',
      cidade: salao.cidade || '',
      estado: salao.estado || '',
      logo_url: salao.logo_url || '',
      cor_primaria: salao.cor_primaria || '#9333ea',
    },
  })

  // Watch for CEP changes to fetch address
  // Only fetches when the user types a NEW CEP (different from the saved one)
  const cep = form.watch('cep')
  const savedCep = useRef((salao.cep || '').replace(/\D/g, ''))
  useEffect(() => {
    const cleanCep = cep?.replace(/\D/g, '')
    
    // Don't fetch if it's the same CEP that was already saved (initial load)
    if (!cleanCep || cleanCep.length !== 8 || cleanCep === savedCep.current) {
      return
    }

    const fetchCep = async () => {
      setIsFetchingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          form.setValue('logradouro', data.logradouro)
          form.setValue('bairro', data.bairro)
          form.setValue('cidade', data.localidade)
          form.setValue('estado', data.uf)
          
          toast({
            title: 'CEP Encontrado!',
            description: 'Endereço preenchido automaticamente.',
          })
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setIsFetchingCep(false)
      }
    }

    fetchCep()
  }, [cep]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: SalaoFormData) {
    try {
      await updateSalao.mutateAsync(data)
      toast({
        title: 'Dados atualizados!',
        description: 'As informações do salão foram atualizadas com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
            <Card className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="bg-accent/10 px-5 py-3 border-b border-border flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Informações do Estabelecimento</h3>
              </div>
              <CardContent className="p-5">
                {/* Basic Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Nome do Salão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome Fantasia" {...field} className="h-10 rounded-md border-border bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0000-00" {...field} className="h-10 rounded-md border-border bg-card" />
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
                          <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} className="h-10 rounded-md border-border bg-card" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="bg-accent/10 px-5 py-3 border-b border-border flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Localização Completa</h3>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">CEP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="00000-000" {...field} className="h-10 rounded-md border-border bg-card" />
                              {isFetchingCep && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-primary" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name="logradouro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Logradouro (Rua/Av)</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua das Flores" {...field} className="h-10 rounded-md border-border bg-card" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} className="h-10 rounded-md border-border bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="complemento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Sala, Bloco, etc." {...field} className="h-10 rounded-md border-border bg-card" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Centro" {...field} className="h-10 rounded-md border-border bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" {...field} className="h-10 rounded-md border-border bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" {...field} className="h-10 rounded-md border-border bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4 border-t border-border/20">
          <Button 
            type="submit" 
            disabled={updateSalao.isPending}
            className="h-10 px-8 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            {updateSalao.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
