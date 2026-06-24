
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useUpdateSalao } from '@/hooks/useSalao'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, Percent, AlertCircle } from 'lucide-react'
import { Salao } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

const taxasSchema = z.object({
  ativo: z.boolean(),
  modo: z.enum(['unica', 'bandeira']),
  taxa_unica: z.number().min(0).max(100),
  taxas_bandeira: z.object({
    Visa: z.number().min(0).max(100),
    MasterCard: z.number().min(0).max(100),
    Elo: z.number().min(0).max(100),
    Amex: z.number().min(0).max(100),
    Hipercard: z.number().min(0).max(100),
    Outros: z.number().min(0).max(100),
  }),
})

type TaxasFormData = z.infer<typeof taxasSchema>

interface TaxasCartaoFormProps {
  salao: Salao
}

export function TaxasCartaoForm({ salao }: TaxasCartaoFormProps) {
  const { toast } = useToast()
  const updateSalao = useUpdateSalao()
  const { isAdmin } = useAuthStore()

  // Extract existing config or defaults
  const existingConfig = (salao.configuracoes as any)?.taxas_cartao || {}
  
  const form = useForm<TaxasFormData>({
    resolver: zodResolver(taxasSchema),
    defaultValues: {
      ativo: existingConfig.ativo ?? false,
      modo: existingConfig.modo ?? 'unica',
      taxa_unica: existingConfig.taxa_unica ?? 0,
      taxas_bandeira: existingConfig.taxas_bandeira ?? {
        Visa: 0,
        MasterCard: 0,
        Elo: 0,
        Amex: 0,
        Hipercard: 0,
        Outros: 0,
      },
    },
  })

  // Permissão visual apenas
  const isEditable = isAdmin

  const ativo = form.watch('ativo')
  const modo = form.watch('modo')

  async function onSubmit(data: TaxasFormData) {
    if (!isAdmin) return

    try {
      const novasConfiguracoes = {
        ...(salao.configuracoes as object || {}),
        taxas_cartao: data
      }

      await updateSalao.mutateAsync({
        configuracoes: novasConfiguracoes
      })

      toast({
        title: 'Taxas atualizadas!',
        description: 'As configurações de cartão de crédito foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações de taxas.',
        variant: 'destructive',
      })
    }
  }

  // Se não for admin, avisar que apenas pode visualizar
  if (!isAdmin) {
    return (
      <Card className="border border-border overflow-hidden rounded-lg bg-card">
        <CardHeader className="border-b border-border bg-accent/20 py-4 px-6">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">Taxas de Cartão</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Acesso restrito a administradores.</p>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border border-border overflow-hidden rounded-lg bg-card">
      <CardHeader className="border-b border-border bg-accent/20 py-4 px-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">Taxas de Cartão</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure as taxas aplicadas no cartão de crédito para cálculos corretos de caixa e comissão.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Controller
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <div className="flex flex-row items-center justify-between rounded-xl border border-border bg-accent/5 p-5 transition-all duration-300">
                <div className="space-y-1">
                  <Label className="text-sm font-bold text-foreground cursor-pointer" htmlFor="toggle-taxas">
                    Habilitar cálculo automático de taxas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ative para descontar automaticamente as taxas de cartão nos cálculos de caixa e comissões.
                  </p>
                </div>
                <Switch 
                  id="toggle-taxas"
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  disabled={!isEditable}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )}
          />
          
          <div className={`transition-all duration-500 ${!ativo ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
            
            <div className="bg-accent/10 border border-border rounded-xl p-5 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Modo de Cobrança
              </h3>
              
              <Controller
                control={form.control}
                name="modo"
                render={({ field }) => (
                  <RadioGroup 
                    value={field.value} 
                    onValueChange={field.onChange} 
                    disabled={!isEditable}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Label 
                      htmlFor="unica" 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${field.value === 'unica' ? 'border-primary bg-accent/50' : 'border-border bg-background hover:bg-accent/30'}`}
                    >
                      <RadioGroupItem value="unica" id="unica" className="mt-1" />
                      <div className="space-y-1">
                        <span className="font-bold text-sm block cursor-pointer text-foreground">Taxa Única Global</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Aplica exatamente a mesma porcentagem para qualquer transação em crédito.</p>
                      </div>
                    </Label>
                    
                    <Label 
                      htmlFor="bandeira" 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${field.value === 'bandeira' ? 'border-primary bg-accent/50' : 'border-border bg-background hover:bg-accent/30'}`}
                    >
                      <RadioGroupItem value="bandeira" id="bandeira" className="mt-1" />
                      <div className="space-y-1">
                        <span className="font-bold text-sm block cursor-pointer text-foreground">Taxa Específica por Bandeira</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Define taxas exatas cobradas por cada operadora de cartão. Mais preciso.</p>
                      </div>
                    </Label>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="space-y-6">
              {modo === 'unica' ? (
                <div className="bg-card p-5 rounded-xl border border-border max-w-sm animate-in fade-in duration-300">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">Percentual Único de Operação (%)</Label>
                  <Controller
                    control={form.control}
                    name="taxa_unica"
                    render={({ field }) => (
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.01" 
                          disabled={!isEditable}
                          value={field.value === 0 ? '' : field.value} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-10 pl-4 pr-10 text-sm font-semibold rounded-md border-border bg-background focus:ring-primary/20"
                          placeholder="Ex: 3.99"
                        />
                        <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 px-1">Se aplicada, usaremos esta taxa para deduzir o valor de entrada automático de todo pagamento em crédito.</p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-4 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 p-3 rounded-lg border border-blue-200 dark:border-blue-900/30 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>Regra de Fallback Ativa: Caso selecione uma bandeira não catalogada na hora da baixa, o sistema aplicará obrigatoriamente a taxa "Outros".</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {['Visa', 'MasterCard', 'Elo', 'Amex', 'Hipercard', 'Outros'].map((bandeira) => (
                      <div key={bandeira} className="bg-card p-4 rounded-lg border border-border">
                        <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">{bandeira}</Label>
                        <Controller
                          control={form.control}
                          name={`taxas_bandeira.${bandeira as keyof TaxasFormData['taxas_bandeira']}`}
                          render={({ field }) => (
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01" 
                                disabled={!isEditable}
                                value={field.value === 0 ? '' : field.value} 
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-10 pr-9 rounded-md border-border bg-background focus:ring-primary/20 font-medium"
                                placeholder={`Taxa de ${bandeira}...`}
                              />
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                            </div>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>

          <div className="flex justify-end pt-4 border-t mt-8">
            <Button 
              type="submit" 
              disabled={!isEditable || updateSalao.isPending}
              className="h-11 px-8 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
            >
              {updateSalao.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando Configurações...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Taxas
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
