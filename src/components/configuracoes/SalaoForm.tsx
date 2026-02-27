import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { salaoSchema, type SalaoFormData } from '@/schemas/salao.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateSalao, useUploadLogo } from '@/hooks/useSalao'
import { useToast } from '@/hooks/use-toast'
import { Upload } from 'lucide-react'
import { useState, useRef } from 'react'
import type { Database } from '@/types/database.types'

type Salao = Database['public']['Tables']['salao']['Row']

interface SalaoFormProps {
  salao: Salao
}

export function SalaoForm({ salao }: SalaoFormProps) {
  const { toast } = useToast()
  const updateSalao = useUpdateSalao()
  const uploadLogo = useUploadLogo()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(salao.logo_url)

  const form = useForm<SalaoFormData>({
    resolver: zodResolver(salaoSchema),
    defaultValues: {
      nome: salao.nome,
      endereco: salao.endereco || '',
      telefone: salao.telefone || '',
      logo_url: salao.logo_url || '',
      cor_primaria: salao.cor_primaria || '#9333ea',
    },
  })

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

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 2MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)

      const publicUrl = await uploadLogo.mutateAsync(file)
      
      await updateSalao.mutateAsync({ logo_url: publicUrl })

      toast({
        title: 'Logo atualizado!',
        description: 'O logo do salão foi atualizado com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Salão</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo do salão"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  {uploadLogo.isPending ? 'Enviando...' : 'Alterar Logo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  PNG, JPG até 2MB
                </p>
              </div>

              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Salão *</FormLabel>
                      <FormControl>
                        <Input placeholder="Salão de Beleza" {...field} />
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
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="cor_primaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor Principal do Sistema</FormLabel>
                  <FormDescription>
                    Personalize a cor principal usada em botões, links e destaques
                  </FormDescription>
                  <FormControl>
                    <ColorPicker value={field.value || '#9333ea'} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSalao.isPending}>
                {updateSalao.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
