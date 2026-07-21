import { useForm } from 'react-hook-form'
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
import { format } from 'date-fns'
import { Check, ChevronsUpDown, UserPlus, AlertCircle, Plus, Trash2, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { ConflictWarningDialog } from './ConflictWarningDialog'

interface AgendamentoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento?: Agendamento | null
  defaultDate?: Date
}

interface ItemFormState {
  servico_id: string
  profissional_id: string
  valor: number
  duracao_minutos: number
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

  const [itemsList, setItemsList] = useState<ItemFormState[]>([
    { servico_id: '', profissional_id: '', valor: 0, duracao_minutos: 30 }
  ])

  const servicosAtivos = servicos.filter((s) => s.ativo)

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      cliente_id: '',
      data: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      hora: '',
      observacoes: '',
    },
  })

  const selectedClienteId = form.watch('cliente_id')
  const clientHasDebt = selectedClienteId
    ? pendenciasGlobais.some((p) => p.cliente_id === selectedClienteId)
    : false

  useEffect(() => {
    if (agendamento) {
      const dataHora = new Date(agendamento.data_hora)
      form.reset({
        cliente_id: agendamento.cliente_id,
        data: format(dataHora, 'yyyy-MM-dd'),
        hora: format(dataHora, 'HH:mm'),
        observacoes: agendamento.observacoes || '',
      })

      if (agendamento.itens && agendamento.itens.length > 0) {
        setItemsList(agendamento.itens.map(item => ({
          servico_id: item.servico_id,
          profissional_id: item.profissional_id,
          valor: item.valor,
          duracao_minutos: item.duracao_minutos || 30
        })))
      } else {
        setItemsList([{
          servico_id: agendamento.servico_id,
          profissional_id: agendamento.profissional_id,
          valor: agendamento.valor,
          duracao_minutos: agendamento.servico?.duracao_minutos || 30
        }])
      }
    } else {
      form.reset({
        cliente_id: '',
        data: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        hora: '',
        observacoes: '',
      })
      setItemsList([{ servico_id: '', profissional_id: '', valor: 0, duracao_minutos: 30 }])
    }
  }, [agendamento, defaultDate, form, open])

  function handleAddItem() {
    const defaultProf = profissionais[0]?.id || ''
    setItemsList(prev => [...prev, { servico_id: '', profissional_id: defaultProf, valor: 0, duracao_minutos: 30 }])
  }

  function handleRemoveItem(index: number) {
    if (itemsList.length <= 1) return
    setItemsList(prev => prev.filter((_, i) => i !== index))
  }

  function handleItemServicoChange(index: number, servicoId: string) {
    const servico = servicos.find(s => s.id === servicoId)
    setItemsList(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        servico_id: servicoId,
        valor: servico?.valor || 0,
        duracao_minutos: servico?.duracao_minutos || 30
      }
      return updated
    })
  }

  function handleItemProfissionalChange(index: number, profId: string) {
    setItemsList(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        profissional_id: profId
      }
      return updated
    })
  }

  const totalValor = itemsList.reduce((acc, item) => acc + (item.valor || 0), 0)
  const totalDuracao = itemsList.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0)

  async function onSubmit(data: AgendamentoFormData) {
    try {
      // Validar se há ao menos 1 item completo
      const hasInvalidItem = itemsList.some(item => !item.servico_id || !item.profissional_id)
      if (hasInvalidItem) {
        toast({
          title: 'Campos incompletos',
          description: 'Selecione o serviço e o profissional para todos os itens da lista.',
          variant: 'destructive',
        })
        return
      }

      const dataHora = new Date(`${data.data}T${data.hora}:00`)

      // Validar se o horário não está no passado
      if (dataHora < new Date()) {
        toast({
          title: 'Horário Inválido',
          description: 'Não é possível agendar para um horário que já passou.',
          variant: 'destructive',
        })
        return
      }

      // Verificar bloqueio para cada profissional único envolvido
      const profIdsUnicos = Array.from(new Set(itemsList.map(i => i.profissional_id)))
      for (const profId of profIdsUnicos) {
        const isBloqueado = await checkBloqueio.mutateAsync({
          profissionalId: profId,
          dataHora: dataHora.toISOString(),
        })

        if (isBloqueado) {
          const profNome = profissionais.find(p => p.id === profId)?.nome || 'Selecionado'
          toast({
            title: 'Horário bloqueado',
            description: `O horário está bloqueado para o profissional ${profNome}.`,
            variant: 'destructive',
          })
          return
        }
      }

      // Verificar conflitos para cada profissional
      for (const item of itemsList) {
        const conflictResult = await checkConflict.mutateAsync({
          profissionalId: item.profissional_id,
          dataHora: dataHora.toISOString(),
          duracaoMinutos: item.duracao_minutos,
          excludeId: agendamento?.id,
        })

        if (conflictResult.hasConflict) {
          setPendingAgendamento({
            data,
            dataHora,
            itemsList,
          })
          setConflictData(conflictResult)
          setShowConflictDialog(true)
          return
        }
      }

      // Prosseguir com salvamento
      await saveAgendamento(data, dataHora, itemsList)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function saveAgendamento(data: AgendamentoFormData, dataHora: Date, itens: ItemFormState[]) {
    try {
      const mainProf = itens[0]?.profissional_id || ''
      const mainServ = itens[0]?.servico_id || ''

      if (agendamento) {
        await updateAgendamento.mutateAsync({
          id: agendamento.id,
          data: {
            cliente_id: data.cliente_id,
            profissional_id: mainProf,
            servico_id: mainServ,
            data_hora: dataHora.toISOString(),
            valor: totalValor,
            observacoes: data.observacoes || null,
            itens: itens as unknown as AgendamentoServico[],
          },
        })
        toast({
          title: 'Agendamento atualizado!',
          description: 'O agendamento com múltiplos serviços foi atualizado.',
        })
      } else {
        await createAgendamento.mutateAsync({
          cliente_id: data.cliente_id,
          profissional_id: mainProf,
          servico_id: mainServ,
          data_hora: dataHora.toISOString(),
          status: 'agendado',
          valor: totalValor,
          observacoes: data.observacoes || null,
          itens: itens as unknown as AgendamentoServico[],
        })
        toast({
          title: 'Agendamento criado!',
          description: 'O agendamento com múltiplos serviços foi criado com sucesso.',
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
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              Selecione o cliente, os serviços e os profissionais correspondentes.
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
                                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
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

              {/* Lista Dinâmica de Serviços e Profissionais */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                    <Scissors className="h-4 w-4 text-purple-600" />
                    Serviços e Profissionais *
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-8 gap-1 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Serviço
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {itemsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/10 space-y-2 relative"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Seleção do Serviço */}
                        <div>
                          <label className="text-xs text-muted-foreground font-medium mb-1 block">
                            Serviço #{idx + 1}
                          </label>
                          <Select
                            value={item.servico_id}
                            onValueChange={(val) => handleItemServicoChange(idx, val)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              {servicosAtivos.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.nome} (R$ {s.valor.toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Seleção do Profissional */}
                        <div>
                          <label className="text-xs text-muted-foreground font-medium mb-1 block">
                            Profissional
                          </label>
                          <Select
                            value={item.profissional_id}
                            onValueChange={(val) => handleItemProfissionalChange(idx, val)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Selecione o profissional" />
                            </SelectTrigger>
                            <SelectContent>
                              {profissionais.map((p) => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">
                                  {p.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-100 dark:border-purple-900/30">
                        <span className="text-purple-700 dark:text-purple-300 font-medium">
                          R$ {item.valor.toFixed(2)} • {item.duracao_minutos} min
                        </span>

                        {itemsList.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Remover Serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Caixa de Resumo de Totais */}
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border text-xs flex justify-between items-center font-medium">
                  <span>
                    Total: <strong className="text-purple-700 dark:text-purple-400 font-bold text-sm">R$ {totalValor.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Duração estimada: <strong>{totalDuracao} minutos</strong>
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
                          className="text-foreground bg-background [color-scheme:light] dark:[color-scheme:dark] h-10 w-full"
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
            const newDataHora = new Date(`${pendingAgendamento.data.data}T${newTime}:00`)
            saveAgendamento(pendingAgendamento.data, newDataHora, pendingAgendamento.itemsList)
          }
        }}
        onSelectDate={(newDate) => {
          const formattedDate = format(newDate, 'yyyy-MM-dd')
          form.setValue('data', formattedDate)
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            const currentHour = form.getValues('hora')
            const newDataHora = new Date(`${formattedDate}T${currentHour}:00`)
            saveAgendamento(pendingAgendamento.data, newDataHora, pendingAgendamento.itemsList)
          }
        }}
        onForceConfirm={() => {
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            saveAgendamento(pendingAgendamento.data, pendingAgendamento.dataHora, pendingAgendamento.itemsList)
          }
        }}
      />
    </>
  )
}
