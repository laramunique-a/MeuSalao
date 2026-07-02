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
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'
import { Check, ChevronsUpDown, UserPlus, AlertCircle } from 'lucide-react'
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

  const [selectedServico, setSelectedServico] = useState<string>('')
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
      profissional_id: '',
      servico_id: '',
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
        profissional_id: agendamento.profissional_id,
        servico_id: agendamento.servico_id,
        data: format(dataHora, 'yyyy-MM-dd'),
        hora: format(dataHora, 'HH:mm'),
        observacoes: agendamento.observacoes || '',
      })
      setSelectedServico(agendamento.servico_id)
    } else {
      form.reset({
        cliente_id: '',
        profissional_id: '',
        servico_id: '',
        data: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        hora: '',
        observacoes: '',
      })
      setSelectedServico('')
    }
  }, [agendamento, defaultDate, form, open])

  async function onSubmit(data: AgendamentoFormData) {
    try {
      const servico = servicos.find((s) => s.id === data.servico_id)
      if (!servico) {
        toast({
          title: 'Erro',
          description: 'Serviço não encontrado',
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

      // Verificar se horário está bloqueado
      const isBloqueado = await checkBloqueio.mutateAsync({
        profissionalId: data.profissional_id,
        dataHora: dataHora.toISOString(),
      })

      if (isBloqueado) {
        toast({
          title: 'Horário bloqueado',
          description: 'Este horário está bloqueado para o profissional selecionado.',
          variant: 'destructive',
        })
        return
      }

      // Verificar conflito de horário avançado
      const conflictResult = await checkConflict.mutateAsync({
        profissionalId: data.profissional_id,
        dataHora: dataHora.toISOString(),
        duracaoMinutos: servico.duracao_minutos,
        excludeId: agendamento?.id,
      })

      if (conflictResult.hasConflict) {
        // Armazenar dados do agendamento pendente
        setPendingAgendamento({
          data,
          servico,
          dataHora,
        })
        setConflictData(conflictResult)
        setShowConflictDialog(true)
        return
      }

      // Prosseguir com salvamento
      await saveAgendamento(data, servico, dataHora)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function saveAgendamento(data: AgendamentoFormData, servico: any, dataHora: Date) {
    try {
      if (agendamento) {
        await updateAgendamento.mutateAsync({
          id: agendamento.id,
          data: {
            cliente_id: data.cliente_id,
            profissional_id: data.profissional_id,
            servico_id: data.servico_id,
            data_hora: dataHora.toISOString(),
            valor: servico.valor,
            observacoes: data.observacoes || null,
          },
        })
        toast({
          title: 'Agendamento atualizado!',
          description: 'O agendamento foi atualizado com sucesso.',
        })
      } else {
        await createAgendamento.mutateAsync({
          cliente_id: data.cliente_id,
          profissional_id: data.profissional_id,
          servico_id: data.servico_id,
          data_hora: dataHora.toISOString(),
          status: 'agendado',
          valor: servico.valor,
          observacoes: data.observacoes || null,
        })
        toast({
          title: 'Agendamento criado!',
          description: 'O agendamento foi criado com sucesso.',
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

  const servicoSelecionado = servicos.find((s) => s.id === selectedServico)

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
                : 'Preencha os dados do novo agendamento.'}
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
                                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-[#FFFFFF] px-3 py-2 text-sm ring-offset-background cursor-pointer',
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

              <FormField
                control={form.control}
                name="profissional_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="servico_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedServico(value)
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    {servicoSelecionado && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Valor: R$ {servicoSelecionado.valor.toFixed(2)} | Duração: {servicoSelecionado.duracao_minutos} minutos
                      </p>
                    )}
                  </FormItem>
                )}
              />

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
                          className="text-foreground bg-[#FFFFFF] [color-scheme:light] dark:[color-scheme:dark] h-10 w-full"
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
                      <FormLabel>Hora * <span className="text-xs font-normal text-muted-foreground">(formato 24h)</span></FormLabel>
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
            saveAgendamento(pendingAgendamento.data, pendingAgendamento.servico, newDataHora)
          }
        }}
        onSelectDate={(newDate) => {
          const formattedDate = format(newDate, 'yyyy-MM-dd')
          form.setValue('data', formattedDate)
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            const currentHour = form.getValues('hora')
            const newDataHora = new Date(`${formattedDate}T${currentHour}:00`)
            saveAgendamento(pendingAgendamento.data, pendingAgendamento.servico, newDataHora)
          }
        }}
        onForceConfirm={() => {
          setShowConflictDialog(false)
          if (pendingAgendamento) {
            saveAgendamento(pendingAgendamento.data, pendingAgendamento.servico, pendingAgendamento.dataHora)
          }
        }}
      />
    </>
  )
}
