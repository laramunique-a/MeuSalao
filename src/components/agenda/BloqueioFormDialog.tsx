import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bloqueioAgendaSchema, type BloqueioAgendaFormData } from '@/schemas/bloqueio-agenda.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TimePicker } from '@/components/ui/time-picker'
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
import { useCreateBloqueio, useUpdateBloqueio } from '@/hooks/useBloqueios'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import type { BloqueioAgenda } from '@/types/models'

interface BloqueioFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bloqueio?: BloqueioAgenda | null
}

export function BloqueioFormDialog({ open, onOpenChange, bloqueio }: BloqueioFormDialogProps) {
  const { toast } = useToast()
  const { usuario, isAdmin } = useAuthStore()
  const { data: profissionais = [] } = useProfissionais()
  const createBloqueio = useCreateBloqueio()
  const updateBloqueio = useUpdateBloqueio()

  const form = useForm<BloqueioAgendaFormData>({
    resolver: zodResolver(bloqueioAgendaSchema),
    defaultValues: {
      profissional_id: '',
      data_inicio: '',
      data_fim: '',
      horario_inicio: '',
      horario_fim: '',
      motivo: '',
    },
  })

  useEffect(() => {
    if (bloqueio) {
      form.reset({
        profissional_id: bloqueio.profissional_id,
        data_inicio: bloqueio.data_inicio.split('T')[0],
        data_fim: bloqueio.data_fim.split('T')[0],
        horario_inicio: bloqueio.horario_inicio,
        horario_fim: bloqueio.horario_fim,
        motivo: bloqueio.motivo || '',
      })
    } else {
      form.reset({
        profissional_id: !isAdmin ? usuario?.id || '' : '',
        data_inicio: '',
        data_fim: '',
        horario_inicio: '',
        horario_fim: '',
        motivo: '',
      })
    }
  }, [bloqueio, form, open])

  async function onSubmit(data: BloqueioAgendaFormData) {
    try {
      if (bloqueio) {
        await updateBloqueio.mutateAsync({
          id: bloqueio.id,
          data: {
            profissional_id: !isAdmin ? usuario!.id : data.profissional_id,
            data_inicio: `${data.data_inicio}T00:00:00`,
            data_fim: `${data.data_fim}T23:59:59`,
            horario_inicio: data.horario_inicio,
            horario_fim: data.horario_fim,
            motivo: data.motivo || null,
          },
        })
        toast({
          title: 'Bloqueio atualizado!',
          description: 'O bloqueio foi atualizado com sucesso.',
        })
      } else {
        await createBloqueio.mutateAsync({
          salao_id: usuario!.salao_id,
          profissional_id: !isAdmin ? usuario!.id : data.profissional_id,
          data_inicio: `${data.data_inicio}T00:00:00`,
          data_fim: `${data.data_fim}T23:59:59`,
          horario_inicio: data.horario_inicio,
          horario_fim: data.horario_fim,
          motivo: data.motivo || null,
        })
        toast({
          title: 'Bloqueio criado!',
          description: 'O bloqueio foi criado com sucesso.',
        })
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar bloqueio',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bloqueio ? 'Editar' : 'Novo'} Bloqueio de Agenda</DialogTitle>
          <DialogDescription>
            Defina um período e horário para bloquear a agenda de um profissional
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="profissional_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!isAdmin}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profissionais.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horario_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Inicial <span className="text-xs font-normal text-muted-foreground">(24h)</span></FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Final <span className="text-xs font-normal text-muted-foreground">(24h)</span></FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Férias, folga, etc."
                      className="resize-none"
                      rows={2}
                      {...field}
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
              <Button
                type="submit"
                disabled={createBloqueio.isPending || updateBloqueio.isPending}
              >
                {createBloqueio.isPending || updateBloqueio.isPending
                  ? 'Salvando...'
                  : bloqueio
                    ? 'Atualizar'
                    : 'Criar Bloqueio'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
