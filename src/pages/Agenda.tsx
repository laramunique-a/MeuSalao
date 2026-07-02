import { useState, useEffect, useRef } from 'react'
import { Plus, Filter, List, CalendarRange, Ban } from 'lucide-react'
import { AgendaButton, AgendaFilterButton } from '@/components/agenda/AgendaComponents'
import { Badge } from '@/components/ui/badge'
import { DateNavigator } from '@/components/ui/date-navigator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { useAgendamentosByDate, useUpdateAgendamentoStatus } from '@/hooks/useAgendamentos'
import { useProfissionais } from '@/hooks/useProfissionais'
import { useBloqueiosByDateRange, useDeleteBloqueio } from '@/hooks/useBloqueios'
import { AgendamentoFormDialog } from '@/components/agenda/AgendamentoFormDialog'
import { BloqueioFormDialog } from '@/components/agenda/BloqueioFormDialog'
import { ConfirmacaoAcaoDialog } from '@/components/auth/ConfirmacaoAcaoDialog'
import { AgendamentosList } from '@/components/agenda/AgendamentosList'
import { AgendamentosWeek } from '@/components/agenda/AgendamentosWeek'
import type { Agendamento } from '@/types/models'
import { useToast } from '@/hooks/use-toast'
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { STATUS_AGENDAMENTO, STATUS_AGENDAMENTO_LABELS } from '@/lib/constants'

export default function Agenda() {
  const { toast } = useToast()
  const { usuario, isAdmin } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [isBloqueioFormOpen, setIsBloqueioFormOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [agendamentoToCancel, setAgendamentoToCancel] = useState<Agendamento | null>(null)
  const [filterProfissional, setFilterProfissional] = useState<string>(
    isAdmin ? 'todos' : usuario?.id || 'todos'
  )
  const [filterStatus, setFilterStatus] = useState<string[]>(
    Object.values(STATUS_AGENDAMENTO).filter(s => s !== STATUS_AGENDAMENTO.CANCELADO)
  )
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list')

  const viewStartDate = viewMode === 'week' ? startOfWeek(selectedDate, { locale: ptBR }) : startOfDay(selectedDate)
  const viewEndDate = viewMode === 'week' ? endOfWeek(selectedDate, { locale: ptBR }) : endOfDay(selectedDate)

  // Usar toISOString() para incluir o offset UTC corretamente (ex: UTC-3 → horários até 02:00 UTC do dia seguinte)
  const startDate = viewStartDate.toISOString()
  const endDate = viewEndDate.toISOString()

  const { data: agendamentos = [], isLoading } = useAgendamentosByDate(startDate, endDate)
  const { data: bloqueios = [] } = useBloqueiosByDateRange(startDate, endDate)
  const { data: profissionais = [] } = useProfissionais()
  const updateStatus = useUpdateAgendamentoStatus()
  const deleteBloqueio = useDeleteBloqueio()

  async function handleDeleteBlock(id: string) {
    const block = bloqueios.find(b => b.id === id)
    if (!block) return

    // Authorization check
    if (!isAdmin && block.profissional_id !== usuario?.id) {
      toast({
        title: 'Acesso negado',
        description: 'Você só pode remover seus próprios bloqueios.',
        variant: 'destructive',
      })
      return
    }

    setBlockToDelete(id)
    setIsConfirmDialogOpen(true)
  }

  async function handleConfirmDelete(data: { email: string; password: string }) {
    if (!blockToDelete) return

    try {
      await authService.verifyCredentials(data.email, data.password)
      await deleteBloqueio.mutateAsync(blockToDelete)
      toast({
        title: 'Bloqueio removido',
        description: 'O bloqueio foi removido com sucesso.',
      })
      setIsConfirmDialogOpen(false)
      setBlockToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Falha na verificação',
        description: 'E-mail ou senha incorretos. Tente novamente.',
        variant: 'destructive',
      })
      throw error // Let the dialog handle loading state
    }
  }

  // Refs para evitar chamadas duplicadas de auto-update
  const statusUpdateInProgress = useRef<Set<string>>(new Set())

  // Auto-atualizar status do agendamento conforme o tempo passa
  useEffect(() => {
    const updateStatuses = async () => {
      const now = new Date()
      const toUpdate: { id: string; status: Agendamento['status'] }[] = []

      agendamentos.forEach(ag => {
        if (statusUpdateInProgress.current.has(ag.id)) return

        const dataInicio = new Date(ag.data_hora)
        const duracao = ag.servico?.duracao_minutos || 60
        const dataFim = new Date(dataInicio.getTime() + duracao * 60000)

        // 1. Agendado -> Em Atendimento (quando chega o horário)
        if (ag.status === 'agendado' && dataInicio <= now) {
          toUpdate.push({ id: ag.id, status: 'em_atendimento' })
        }
        // 2. Em Atendimento -> Pendente Caixa (quando termina a duração)
        else if (ag.status === 'em_atendimento' && dataFim <= now) {
          toUpdate.push({ id: ag.id, status: 'pendente_caixa' })
        }
      })

      if (toUpdate.length === 0) return

      for (const { id, status } of toUpdate) {
        try {
          statusUpdateInProgress.current.add(id)
          await updateStatus.mutateAsync({ id, status })
        } catch (error) {
          console.error(`Erro ao auto-atualizar agendamento ${id} para ${status}:`, error)
        } finally {
          setTimeout(() => {
            statusUpdateInProgress.current.delete(id)
          }, 5000)
        }
      }
    }

    const timer = setInterval(() => {
      if (agendamentos.length > 0) updateStatuses()
    }, 10000) // Verifica a cada 10 segundos

    return () => clearInterval(timer)
  }, [agendamentos, updateStatus])

  const filteredAgendamentos = agendamentos.filter((a) => {
    const matchesProfissional = filterProfissional === 'todos' || a.profissional_id === filterProfissional
    const matchesStatus = filterStatus.includes(a.status)
    return matchesProfissional && matchesStatus
  })

  const filteredBloqueios =
    filterProfissional === 'todos'
      ? bloqueios
      : bloqueios.filter((b) => b.profissional_id === filterProfissional)

  const agendamentosOrdenados = [...filteredAgendamentos].sort(
    (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
  )

  function handleEdit(agendamento: Agendamento) {
    if (['concluido', 'cancelado'].includes(agendamento.status)) {
      toast({
        title: 'Atendimento finalizado',
        description: `Este agendamento está com status "${agendamento.status === 'concluido' ? 'Concluído' : 'Cancelado'}" e não pode ser alterado.`,
      })
      return
    }
    setSelectedAgendamento(agendamento)
    setIsFormOpen(true)
  }

  function handleCancel(agendamento: Agendamento) {
    setAgendamentoToCancel(agendamento)
    setIsCancelDialogOpen(true)
  }

  async function confirmCancel() {
    if (!agendamentoToCancel) return

    try {
      await updateStatus.mutateAsync({
        id: agendamentoToCancel.id,
        status: 'cancelado',
      })
      toast({
        title: 'Agendamento cancelado!',
        description: 'O agendamento foi cancelado com sucesso.',
      })
      setIsCancelDialogOpen(false)
      setAgendamentoToCancel(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar agendamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  async function handleChangeStatus(agendamento: Agendamento, status: Agendamento['status']) {
    try {
      await updateStatus.mutateAsync({ id: agendamento.id, status })
      toast({
        title: 'Status atualizado!',
        description: `Agendamento alterado para ${status}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  function handleCloseForm() {
    setIsFormOpen(false)
    setSelectedAgendamento(null)
  }

  function handlePrevious() {
    setSelectedDate(viewMode === 'week' ? subDays(selectedDate, 7) : subDays(selectedDate, 1))
  }

  function handleNext() {
    setSelectedDate(viewMode === 'week' ? addDays(selectedDate, 7) : addDays(selectedDate, 1))
  }

  function handleToday() {
    setSelectedDate(new Date())
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <AgendaButton variant="outline" className="bg-[#FFFFFF] dark:bg-card" onClick={() => setIsBloqueioFormOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Bloquear
          </AgendaButton>
          <AgendaButton onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </AgendaButton>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 bg-card p-3 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <DateNavigator
            mode="single"
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrev={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            isTodayActive={isToday}
          />

          <Badge variant="secondary" className="h-7 px-3 text-[10px] font-medium border border-border text-muted-foreground bg-background rounded-full">
            {agendamentosOrdenados.length === 0 ? (
              <span>Nenhum agendamento</span>
            ) : (
              <>
                <span className="font-semibold text-foreground mr-1">{agendamentosOrdenados.length}</span>
                {agendamentosOrdenados.length === 1 ? 'agendamento' : 'agendamentos'}
              </>
            )}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-none min-w-0">
            <Select value={filterProfissional} onValueChange={setFilterProfissional}>
              <SelectTrigger className="w-full md:w-[180px] h-10 border-border rounded-xl justify-center gap-2">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Profissionais</SelectItem>
                {profissionais.map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AgendaFilterButton 
                  active={filterStatus.length < Object.values(STATUS_AGENDAMENTO).length} 
                  className="gap-2"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Status
                  {filterStatus.length < Object.values(STATUS_AGENDAMENTO).length && (
                    <Badge variant="default" className="ml-1 px-1.5 py-0 h-4 min-w-4 flex items-center justify-center text-[10px]">
                      {filterStatus.length}
                    </Badge>
                  )}
                </AgendaFilterButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(STATUS_AGENDAMENTO_LABELS).map(([value, label]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={filterStatus.includes(value)}
                    onCheckedChange={(checked) => {
                      setFilterStatus(prev =>
                        checked
                          ? [...prev, value]
                          : prev.filter(s => s !== value)
                      )
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setFilterStatus(Object.values(STATUS_AGENDAMENTO))}
                  className="justify-center text-primary font-medium"
                >
                  Selecionar Todos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-8 w-[1px] bg-border hidden md:block mx-1" />

          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as any)}
            className="bg-background border border-border p-0.5 rounded-xl h-10 flex items-center gap-1"
          >
            <ToggleGroupItem value="list" className="h-9 w-9 p-0 rounded-lg" aria-label="Lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="week" className="h-9 w-9 p-0 rounded-lg" aria-label="Semana">
              <CalendarRange className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Carregando agendamentos...</div>
      ) : viewMode === 'list' ? (
        <AgendamentosList
          agendamentos={agendamentosOrdenados}
          bloqueios={filteredBloqueios}
          filterProfissional={filterProfissional}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onChangeStatus={handleChangeStatus}
          onDeleteBlock={handleDeleteBlock}
        />
      ) : (
        <AgendamentosWeek
          agendamentos={agendamentos}
          bloqueios={bloqueios}
          selectedDate={selectedDate}
          filterProfissional={filterProfissional}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onChangeStatus={handleChangeStatus}
          onDeleteBlock={handleDeleteBlock}
        />
      )}

      <AgendamentoFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        agendamento={selectedAgendamento}
        defaultDate={selectedDate}
      />

      <BloqueioFormDialog
        open={isBloqueioFormOpen}
        onOpenChange={setIsBloqueioFormOpen}
      />

      <ConfirmacaoAcaoDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Confirmar Remoção de Bloqueio"
        description="Esta ação requer confirmação de segurança. Por favor, informe suas credenciais."
      />

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="border-border rounded-lg bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? O registro será mantido com status "Cancelado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <AgendaButton variant="outline">Voltar</AgendaButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <AgendaButton 
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white hover:translate-y-[-1px]"
              >
                Cancelar Agendamento
              </AgendaButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
