import { useMutation } from '@tanstack/react-query'
import { agendamentoService } from '@/services/agendamento.service'
import { format, addMinutes } from 'date-fns'

interface ConflictCheckParams {
  profissionalId: string
  dataHora: string
  duracaoMinutos: number
  excludeId?: string
}

interface ConflictResult {
  hasConflict: boolean
  conflictInfo?: {
    conflictStart: Date
    conflictEnd: Date
    existingAgendamento: {
      id: string
      cliente: string
      servico: string
      horario: string
      duracao: number
    }
  }
  suggestedTimes: string[]
}

export function useAdvancedConflictCheck() {
  return useMutation({
    mutationFn: async (params: ConflictCheckParams): Promise<ConflictResult> => {
      const { profissionalId, dataHora, duracaoMinutos, excludeId } = params

      // Verificar conflito básico
      const hasConflict = await agendamentoService.checkConflict(
        profissionalId,
        dataHora,
        duracaoMinutos,
        excludeId,
      )

      if (!hasConflict) {
        return { hasConflict: false, suggestedTimes: [] }
      }

      // Buscar agendamentos do dia para análise detalhada
      const dataInicio = new Date(dataHora)
      dataInicio.setHours(0, 0, 0, 0)
      const dataFim = new Date(dataHora)
      dataFim.setHours(23, 59, 59, 999)

      const agendamentosDoDia = await agendamentoService.getByProfissionalAndDate(
        profissionalId,
        dataInicio.toISOString(),
        dataFim.toISOString()
      )

      // Encontrar o agendamento conflitante
      const novoInicio = new Date(dataHora)
      const novoFim = addMinutes(novoInicio, duracaoMinutos)

      const conflitante = agendamentosDoDia.find((ag) => {
        if (excludeId && ag.id === excludeId) return false

        const agInicio = new Date(ag.data_hora)
        const agFim = addMinutes(agInicio, ag.servico?.duracao_minutos || 60)

        // Verificar sobreposição
        return (
          (novoInicio >= agInicio && novoInicio < agFim) ||
          (novoFim > agInicio && novoFim <= agFim) ||
          (novoInicio <= agInicio && novoFim >= agFim)
        )
      })

      let conflictInfo
      if (conflitante) {
        const agInicio = new Date(conflitante.data_hora)
        const agFim = addMinutes(agInicio, conflitante.servico?.duracao_minutos || 60)

        const conflictStart = novoInicio > agInicio ? novoInicio : agInicio
        const conflictEnd = novoFim < agFim ? novoFim : agFim

        conflictInfo = {
          conflictStart,
          conflictEnd,
          existingAgendamento: {
            id: conflitante.id,
            cliente: conflitante.cliente?.nome || 'Cliente',
            servico: conflitante.servico?.nome || 'Serviço',
            horario: format(agInicio, 'HH:mm'),
            duracao: conflitante.servico?.duracao_minutos || 60,
          },
        }
      }

      // Sugerir horários alternativos
      const suggestedTimes = generateSuggestedTimes(
        agendamentosDoDia.filter((ag) => excludeId !== ag.id),
        duracaoMinutos,
        dataHora
      )

      return {
        hasConflict: true,
        conflictInfo,
        suggestedTimes,
      }
    },
  })
}

function generateSuggestedTimes(
  agendamentos: any[],
  duracaoNecessaria: number,
  dataHoraDesejada: string
): string[] {
  const suggestions: string[] = []
  const dataDesejada = new Date(dataHoraDesejada)

  // Horários de funcionamento: 08:00 às 20:00
  const horaInicio = 8
  const horaFim = 20

  // Criar array de slots ocupados
  const slotsOcupados = agendamentos.map((ag) => {
    const inicio = new Date(ag.data_hora)
    const fim = addMinutes(inicio, ag.servico?.duracao_minutos || 60)
    return { inicio, fim }
  })

  // Verificar slots de 15 em 15 minutos
  let horaAtual = new Date(dataDesejada)
  // Filtrar para mostrar apenas horários APÓS o horário desejado/conflito
  const limiteInferior = new Date(dataHoraDesejada)

  horaAtual.setHours(horaInicio, 0, 0, 0)
  if (horaAtual < limiteInferior) {
    horaAtual = new Date(limiteInferior)
    // Arredondar para o próximo slot de 15 min
    const mins = horaAtual.getMinutes()
    const diff = 15 - (mins % 15)
    if (mins % 15 !== 0) {
      horaAtual = addMinutes(horaAtual, diff)
    }
  }

  const horaFinal = new Date(dataDesejada)
  horaFinal.setHours(horaFim, 0, 0, 0)

  while (horaAtual < horaFinal && suggestions.length < 6) {
    const slotFim = addMinutes(horaAtual, duracaoNecessaria)

    // Verificar se o slot está livre
    const isLivre = !slotsOcupados.some((slot) => {
      return (
        (horaAtual >= slot.inicio && horaAtual < slot.fim) ||
        (slotFim > slot.inicio && slotFim <= slot.fim) ||
        (horaAtual <= slot.inicio && slotFim >= slot.fim)
      )
    })

    if (isLivre && slotFim <= horaFinal) {
      suggestions.push(format(horaAtual, 'HH:mm'))
    }

    horaAtual = addMinutes(horaAtual, 15)
  }

  return suggestions
}
