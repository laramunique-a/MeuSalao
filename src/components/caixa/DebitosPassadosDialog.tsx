import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, DollarSign, User } from 'lucide-react'
import type { Agendamento } from '@/types/models'
import { format } from 'date-fns'

interface DebitosPassadosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendencias: Agendamento[]
  onReceber: (ag: Agendamento) => void
}

export function DebitosPassadosDialog({
  open,
  onOpenChange,
  pendencias,
  onReceber,
}: DebitosPassadosDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500">
            <AlertCircle className="h-5 w-5" />
            Débitos de Caixas Anteriores
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-xs space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Abaixo estão listados todos os atendimentos finalizados em caixas de períodos anteriores que ainda permanecem sem quitação financeira.
          </p>

          <div className="border border-border rounded-lg overflow-hidden bg-background">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-accent/50 text-muted-foreground border-b border-border font-semibold text-[9px] uppercase">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Cliente / Profissional</th>
                    <th className="px-3 py-2">Serviço</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendencias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-wider">
                        Nenhum débito pendente de caixas anteriores.
                      </td>
                    </tr>
                  ) : (
                    pendencias.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/10">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                          {format(new Date(p.data_hora), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-foreground truncate max-w-[150px]">{p.cliente?.nome}</p>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mt-0.5 flex items-center gap-0.5">
                            <User className="h-2.5 w-2.5" />
                            {p.profissional?.nome}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground font-semibold uppercase tracking-wider truncate max-w-[120px]" title={p.servico?.nome}>
                          {p.servico?.nome}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-foreground whitespace-nowrap">
                          R$ {p.valor.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[10px] font-semibold uppercase tracking-wider rounded-md"
                            onClick={() => {
                              onReceber(p)
                              onOpenChange(false)
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            Baixar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
