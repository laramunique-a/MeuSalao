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
    <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBloqueioFormOpen(true)} className="h-9 px-3">
            <Ban className="h-4 w-4 mr-2" />
            Bloquear
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 px-3 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm transition-all duration-300">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-xl border border-border/40 p-1 shadow-sm group hover:border-primary/30 transition-all">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevious} 
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleToday}
              className={cn(
                "h-8 px-4 text-xs font-bold relative overflow-hidden",
                isToday 
                  ? "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.2)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              Hoje
              {isToday && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNext} 
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-10 px-3 gap-2 rounded-xl transition-all duration-300 shadow-none hover:shadow-none",
                  "hover:bg-primary/5 active:scale-95",
                  "group border border-transparent hover:border-primary/20"
                )}
              >
                <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </span>
                  <span className="text-base font-bold tracking-tight">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ptBR}
                className="p-3"
              />
            </PopoverContent>
          </Popover>

          <Badge variant="secondary" className="h-7 px-3 text-[11px] font-bold bg-background/40 backdrop-blur-sm border border-border/50 text-muted-foreground rounded-full shadow-sm">
            {agendamentosOrdenados.length === 0 ? (
              <span>Nenhum agendamento</span>
            ) : (
              <>
                <span className="text-primary mr-1">{agendamentosOrdenados.length}</span>
                {agendamentosOrdenados.length === 1 ? 'agendamento' : 'agendamentos'}
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <Select value={filterProfissional} onValueChange={setFilterProfissional}>
              <SelectTrigger className="w-full md:w-[180px] h-10 bg-background border-border">
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
                <Button variant="outline" className="h-10 border-border bg-background gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Status
                  {filterStatus.length < Object.values(STATUS_AGENDAMENTO).length && (
                    <Badge variant="default" className="ml-1 px-1.5 py-0 h-4 min-w-4 flex items-center justify-center text-[10px]">
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
          </div>

          <div className="h-8 w-[1px] bg-border hidden md:block mx-1" />

          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as any)}
            className="bg-background border border-border p-1 rounded-lg"
          >
            <ToggleGroupItem value="list" className="h-7 w-7 p-0" aria-label="Lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="week" className="h-7 w-7 p-0" aria-label="Semana">
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
