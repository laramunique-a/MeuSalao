import { useState, useEffect, useRef } from 'react'
import { Plus, Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight, List, CalendarRange, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { cn } from '@/lib/utils'
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

  const startDate = format(viewStartDate, "yyyy-MM-dd'T'HH:mm:ss")
  const endDate = format(viewEndDate, "yyyy-MM-dd'T'HH:mm:ss")

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

  // Auto-atualizar status para 'Pendente Caixa' quando o tempo do serviço passar
  const statusUpdateInProgress = useRef<Set<string>>(new Set())

  useEffect(() => {
    const checkPendenteCaixa = async () => {
      const now = new Date()
      // Filtrar agendamentos que estão 'em_atendimento' e já deveriam ter terminado
      const toUpdate = agendamentos.filter(ag => {
        if (ag.status !== 'em_atendimento') return false
        if (statusUpdateInProgress.current.has(ag.id)) return false

        const dataInicio = new Date(ag.data_hora)
        const duracao = ag.servico?.duracao_minutos || 60
        const dataFim = new Date(dataInicio.getTime() + duracao * 60000)

        return dataFim < now
      })

      if (toUpdate.length === 0) return

      for (const ag of toUpdate) {
        try {
          statusUpdateInProgress.current.add(ag.id)
          await updateStatus.mutateAsync({
            id: ag.id,
            status: 'pendente_caixa'
          })
        } catch (error) {
          console.error(`Erro ao auto-atualizar agendamento ${ag.id}:`, error)
        } finally {
          // Removemos do set após um tempo para evitar loops imediatos se o refetch for lento
          setTimeout(() => {
            statusUpdateInProgress.current.delete(ag.id)
          }, 5000)
        }
      }
    }

    const timer = setTimeout(() => {
      if (agendamentos.length > 0) {
        checkPendenteCaixa()
      }
    }, 1000)

    return () => clearTimeout(timer)
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os agendamentos do salão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsBloqueioFormOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Bloquear Agenda
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("min-w-[240px] justify-start text-left font-normal")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant={isToday ? 'secondary' : 'outline'}
            onClick={handleToday}
            size="sm"
          >
            Hoje
          </Button>

          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filterProfissional} onValueChange={setFilterProfissional}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os profissionais</SelectItem>
              {profissionais.map((profissional) => (
                <SelectItem key={profissional.id} value={profissional.id}>
                  {profissional.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                Status
                {filterStatus.length < Object.values(STATUS_AGENDAMENTO).length && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                    {filterStatus.length}
                  </Badge>
                )}
              </Button>
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

          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)}>
            <ToggleGroupItem value="list" aria-label="Visualização em lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Visualização semanal">
              <CalendarRange className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {agendamentosOrdenados.length}{' '}
            {agendamentosOrdenados.length === 1 ? 'agendamento' : 'agendamentos'}
          </p>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? O registro será mantido com status "Cancelado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
