import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { agendamentoSchema, type AgendamentoFormData } from '@/schemas/agendamento.schema'
import { Button } from '@/components/ui/button'
import { AgendaButton } from './AgendaComponents'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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

import { useCreateAgendamento, useUpdateAgendamento, usePendenciasGlobais } from '@/hooks/useAgendamentos'
import { useAdvancedConflictCheck } from '@/hooks/useAdvancedConflictCheck'
import { useCheckBloqueio } from '@/hooks/useBloqueios'
import { useClientes } from '@/hooks/useClientes'
import { useServicos } from '@/hooks/useServicos'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import type { Agendamento, AgendamentoServico } from '@/types/models'
import { format, addMinutes } from 'date-fns'
import { Check, ChevronsUpDown, UserPlus, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { ConflictWarningDialog } from './ConflictWarningDialog'

interface AgendamentoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento?: Agendamento | null
  defaultDate?: Date
}

export function AgendamentoFormDialog({
  open,
  onOpenChange,
  agendamento,
  defaultDate,
}: AgendamentoFormDialogProps) {
  const { toast } = useToast()
  const createAgendamento = useCreateAgendamento()
  const updateAgendamento = useUpdateAgendamento()
  const checkConflict = useAdvancedConflictCheck()
  const checkBloqueio = useCheckBloqueio()

  const { data: clientes = [] } = useClientes()
  const { data: servicos = [] } = useServicos()
  const { data: profissionais = [] } = useProfissionais()
  const { data: pendenciasGlobais = [] } = usePendenciasGlobais()

  const [clienteNaoCadastrado, setClienteNaoCadastrado] = useState<string | null>(null)
  const [showClienteFormDialog, setShowClienteFormDialog] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)
  const [pendingAgendamento, setPendingAgendamento] = useState<any>(null)

  const servicosAtivos = servicos.filter((s) => s.ativo)

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      cliente_id: '',
      itens: [
        {
          servico_id: '',
          profissional_id: '',
        },
      ],
      data: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      hora: '',
      observacoes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  })

  const selectedClienteId = form.watch('cliente_id')
  const watchedItens = form.watch('itens') || []

  const clientHasDebt = selectedClienteId
    ? pendenciasGlobais.some((p) => p.cliente_id === selectedClienteId)
    : false

  const totalValor = watchedItens.reduce((acc, item) => {
    const serv = servicos.find((s) => s.id === item.servico_id)
    return acc + (serv?.valor || 0)
  }, 0)

  const totalDuracao = watchedItens.reduce((acc, item) => {
    const serv = servicos.find((s) => s.id === item.servico_id)
    return acc + (serv?.duracao_minutos || 0)
  }, 0)

  useEffect(() => {
    if (agendamento) {
      const dataHora = new Date(agendamento.data_hora)

      if (agendamento.itens && agendamento.itens.length > 0) {
        form.reset({
          cliente_id: agendamento.cliente_id,
          itens: agendamento.itens.map((it) => ({
            servico_id: it.servico_id,
            profissional_id: it.profissional_id,
          })),
          data: format(dataHora, 'yyyy-MM-dd'),
          hora: format(dataHora, 'HH:mm'),
          observacoes: agendamento.observacoes || '',
        })
      } else {
        form.reset({
          cliente_id: agendamento.cliente_id,
          itens: [
            {
              servico_id: agendamento.servico_id,
              profissional_id: agendamento.profissional_id,
            },
          ],
          data: format(dataHora, 'yyyy-MM-dd'),
          hora: format(dataHora, 'HH:mm'),
          observacoes: agendamento.observacoes || '',
        })
      }
    } else {
      form.reset({
        cliente_id: '',
        itens: [
          {
            servico_id: '',
            profissional_id: '',
          },
        ],
        data: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        hora: '',
        observacoes: '',
      })
    }
  }, [agendamento, defaultDate, form, open])

  async function onSubmit(data: AgendamentoFormData) {
    try {
      if (!data.itens || data.itens.length === 0) {
        toast({
          title: 'Erro',
          description: 'Adicione pelo menos um serviço ao agendamento.',
          variant: 'destructive',
        })
        return
      }

      const invalidItem = data.itens.find((it) => !it.servico_id || !it.profissional_id)
      if (invalidItem) {
        toast({
          title: 'Campos incompletos',
          description: 'Selecione o serviço e o profissional correspondente.',
          variant: 'destructive',
        })
        return
      }

      const currentDataHora = new Date(`${data.data}T${data.hora}:00`)

      if (currentDataHora < new Date()) {
        toast({
          title: 'Horário Inválido',
          description: 'Não é possível agendar para um horário que já passou.',
          variant: 'destructive',
        })
        return
      }

      let itemStart = new Date(currentDataHora)

      for (let i = 0; i < data.itens.length; i++) {
        const item = data.itens[i]
        const servico = servicos.find((s) => s.id === item.servico_id)
        if (!servico) continue

        const isBloqueado = await checkBloqueio.mutateAsync({
          profissionalId: item.profissional_id,
          dataHora: itemStart.toISOString(),
        })

        if (isBloqueado) {
          toast({
            title: 'Horário bloqueado',
            description: `Este horário está bloqueado para o profissional no serviço #${i + 1}.`,
            variant: 'destructive',
          })
          return
        }

        const conflictResult = await checkConflict.mutateAsync({
          profissionalId: item.profissional_id,
          dataHora: itemStart.toISOString(),
          duracaoMinutos: servico.duracao_minutos,
          excludeId: i === 0 ? agendamento?.id : undefined,
        })

        if (conflictResult.hasConflict) {
          setPendingAgendamento({
            data,
            servico,
            dataHora: currentDataHora,
          })
          setConflictData(conflictResult)
          setShowConflictDialog(true)
          return
        }

        itemStart = addMinutes(itemStart, servico.duracao_minutos)
      }

      await saveAgendamentos(data)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function saveAgendamentos(data: AgendamentoFormData) {
    try {
      let currentDataHora = new Date(`${data.data}T${data.hora}:00`)

      const itensList = data.itens || []
      const mainProf = itensList[0]?.profissional_id || ''
      const mainServ = itensList[0]?.servico_id || ''

      const mappedItens: AgendamentoServico[] = itensList.map((it) => {
        const serv = servicos.find((s) => s.id === it.servico_id)
        return {
          servico_id: it.servico_id,
          profissional_id: it.profissional_id,
          valor: serv?.valor || 0,
          duracao_minutos: serv?.duracao_minutos || 30,
        }
      })

      if (agendamento) {
        await updateAgendamento.mutateAsync({
          id: agendamento.id,
          data: {
            cliente_id: data.cliente_id,
            profissional_id: mainProf,
            servico_id: mainServ,
            data_hora: currentDataHora.toISOString(),
            valor: totalValor,
            observacoes: data.observacoes || null,
            itens: mappedItens,
          },
        })

        toast({
          title: 'Agendamento atualizado!',
          description: itensList.length > 1 
            ? `${itensList.length} serviços agendados com sucesso.` 
            : 'O agendamento foi atualizado com sucesso.',
        })
      } else {
        await createAgendamento.mutateAsync({
          cliente_id: data.cliente_id,
          profissional_id: mainProf,
          servico_id: mainServ,
          data_hora: currentDataHora.toISOString(),
          status: 'agendado',
          valor: totalValor,
          observacoes: data.observacoes || null,
          itens: mappedItens,
        })

        toast({
          title: 'Agendamento criado!',
          description: itensList.length > 1 
            ? `${itensList.length} serviços agendados com sucesso.` 
            : 'O agendamento foi criado com sucesso.',
        })
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {agendamento
                ? 'Edite as informações do agendamento abaixo.'
                : 'Selecione o cliente, os serviços e os profissionais correspondentes.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => {
                  const [openCombobox, setOpenCombobox] = useState(false)
                  const [search, setSearch] = useState('')
                  const clienteLabel = clientes.find((c) => c.id === field.value)?.nome || ''
                  const filtered = clientes.filter((c) =>
                    c.nome.toLowerCase().includes(search.toLowerCase())
                  )
                  return (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <div
                              role="combobox"
                              aria-expanded={openCombobox}
                              className={cn(
                                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-card px-3 py-2 text-sm ring-offset-background cursor-pointer',
                                'hover:bg-accent hover:text-accent-foreground',
                                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <span>{field.value ? clienteLabel : 'Digite ou selecione o cliente'}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </div>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar cliente..."
                              value={search}
                              onValueChange={setSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="py-3 px-4 space-y-2">
                                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                                  {search && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full gap-2"
                                      onClick={() => {
                                        setClienteNaoCadastrado(search)
                                        setShowClienteFormDialog(true)
                                        setOpenCombobox(false)
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Cadastrar "{search}"
                                    </Button>
                                  )}
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {filtered.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.nome}
                                    onSelect={() => {
                                      field.onChange(c.id)
                                      setOpenCombobox(false)
                                      setSearch('')
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value === c.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {c.nome}
                                    {c.telefone && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {c.telefone}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {clientHasDebt && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Cliente com Débito Pendente</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Este cliente possui pagamentos pendentes de atendimentos anteriores no sistema.
                    </p>
                  </div>
                </div>
              )}

              {/* Seção Serviços e Profissionais */}
              <div className="space-y-3">
                <FormLabel className="text-sm font-medium text-foreground">
                  Serviços e Profissionais *
                </FormLabel>

                {/* Lista de cards de serviço */}
                <div className="space-y-3">
                  {fields.map((fieldItem, index) => {
                    const itemServicoId = form.watch(`itens.${index}.servico_id`)
                    const itemServico = servicos.find((s) => s.id === itemServicoId)

                    return (
                      <div
                        key={fieldItem.id}
                        className="p-4 bg-white dark:bg-card border border-border rounded-xl space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Serviço #{index + 1}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => remove(index)}
                              title="Remover serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.servico_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">
                                  Serviço
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-card">
                                      <SelectValue placeholder="Selecione o serviço" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {servicosAtivos.map((servico) => (
                                      <SelectItem key={servico.id} value={servico.id}>
                                        {servico.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`itens.${index}.profissional_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">
                                  Profissional
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-card">
                                      <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {profissionais.map((profissional) => (
                                      <SelectItem key={profissional.id} value={profissional.id}>
                                        {profissional.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="text-xs font-medium text-muted-foreground pt-1">
                          R$ {(itemServico?.valor || 0).toFixed(2)} • {itemServico?.duracao_minutos || 30} min
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Botão de Adicionar Serviço (posicionado entre serviço 1 e o total) */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const firstProfId = form.getValues('itens.0.profissional_id') || ''
                    append({ servico_id: '', profissional_id: firstProfId })
                  }}
                  className="w-full h-10 border-dashed border-border bg-white dark:bg-card hover:bg-accent/80 text-foreground font-semibold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-none"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Serviço
                </Button>

                {/* Box do Total */}
                <div className="p-4 bg-white dark:bg-card border border-border rounded-xl flex items-center justify-between shadow-sm text-sm">
                  <span className="font-semibold text-foreground">
                    Total: <span className="font-bold text-foreground">R$ {totalValor.toFixed(2)}</span>
                  </span>
                  <span className="text-muted-foreground font-medium">
                    Duração estimada: <span className="font-semibold text-foreground">{totalDuracao} minutos</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="text-foreground bg-white dark:bg-card [color-scheme:light] dark:[color-scheme:dark] h-10 w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Hora de Início * <span className="text-xs font-normal text-muted-foreground">(formato 24h)</span></FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="sm:w-[150px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais..."
                        className="resize-none bg-white dark:bg-card"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <AgendaButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </AgendaButton>
                <AgendaButton
                  type="submit"
                  disabled={
                    createAgendamento.isPending ||
                    updateAgendamento.isPending ||
                    checkConflict.isPending
                  }
                >
                  {createAgendamento.isPending || updateAgendamento.isPending || checkConflict.isPending
                    ? 'Salvando...'
                    : agendamento
                      ? 'Atualizar Agendamento'
                      : 'Criar Agendamento'}
                </AgendaButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para cadastrar cliente não cadastrado */}
      <ClienteFormDialog
        open={showClienteFormDialog}
        onOpenChange={(open) => {
          setShowClienteFormDialog(open)
          if (!open) {
            setClienteNaoCadastrado(null)
          }
        }}
        onSuccess={(newCliente) => {
          form.setValue('cliente_id', newCliente.id)
          setClienteNaoCadastrado(null)
          setShowClienteFormDialog(false)
        }}
        cliente={
          clienteNaoCadastrado
            ? {
              id: '',
              salao_id: '',
              nome: clienteNaoCadastrado,
              telefone: '',
              email: null,
              observacoes: null,
              created_at: '',
              updated_at: '',
            }
            : undefined
        }
      />

      {/* Dialog de aviso de conflito de horário */}
      <ConflictWarningDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflictInfo={conflictData?.conflictInfo}
        suggestedTimes={conflictData?.suggestedTimes || []}
        isLoading={createAgendamento.isPending || updateAgendamento.isPending}
        onSelectTime={(newTime) => {
          form.setValue('hora', newTime)
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            saveAgendamentos({
              ...pendingAgendamento.data,
              hora: newTime,
            })
          }
        }}
        onSelectDate={(newDate) => {
          const formattedDate = format(newDate, 'yyyy-MM-dd')
          form.setValue('data', formattedDate)
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            saveAgendamentos({
              ...pendingAgendamento.data,
              data: formattedDate,
            })
          }
        }}
        onForceConfirm={() => {
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            saveAgendamentos(pendingAgendamento.data)
          }
        }}
      />
    </>
  )
}
