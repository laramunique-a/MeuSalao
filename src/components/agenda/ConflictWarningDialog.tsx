import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Clock, Calendar as CalendarIcon } from 'lucide-react'

import { ptBR } from 'date-fns/locale'

interface ConflictWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflictInfo: {
    conflictStart: Date
    conflictEnd: Date
    existingAgendamento: {
      cliente: string
      servico: string
      horario: string
    }
  } | null
  suggestedTimes: string[]
  onSelectTime: (time: string) => void
  onSelectDate: (date: Date) => void
  onForceConfirm: () => void
  isLoading?: boolean
}

export function ConflictWarningDialog({
  open,
  onOpenChange,
  conflictInfo,
  suggestedTimes,
  onSelectTime,
  onSelectDate,
  onForceConfirm,
  isLoading,
}: ConflictWarningDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  if (!conflictInfo) return null

  const conflictDuration = Math.round(
    (conflictInfo.conflictEnd.getTime() - conflictInfo.conflictStart.getTime()) / (1000 * 60)
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Conflito de Horário Detectado</AlertDialogTitle>
              <AlertDialogDescription>
                Já existe um agendamento neste horário
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Informações do Conflito */}
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Sobreposição de {conflictDuration} minutos
                </p>
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p>
                    <strong>Cliente:</strong> {conflictInfo.existingAgendamento.cliente}
                  </p>
                  <p>
                    <strong>Serviço:</strong> {conflictInfo.existingAgendamento.servico}
                  </p>
                  <p>
                    <strong>Horário:</strong> {conflictInfo.existingAgendamento.horario}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Opções de Resolução */}
          <Tabs defaultValue="times" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="times" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Alterar Horário
              </TabsTrigger>
              <TabsTrigger value="date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Alterar Dia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="times" className="space-y-3 mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Horários livres próximos no mesmo dia:
              </p>
              {suggestedTimes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {suggestedTimes.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      onClick={() => {
                        onSelectTime(time)
                        onOpenChange(false)
                      }}
                      className="justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Nenhum horário livre disponível hoje
                </p>
              )}
            </TabsContent>

            <TabsContent value="date" className="space-y-3 mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecione outra data:
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      onSelectDate(date)
                      onOpenChange(false)
                    }
                  }}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="border rounded-md"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onForceConfirm()
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Confirmar Mesmo Assim'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
