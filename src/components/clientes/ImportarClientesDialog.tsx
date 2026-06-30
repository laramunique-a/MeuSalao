import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useImportClientes } from '@/hooks/useClientes'
import { Upload, FileSpreadsheet, CheckCircle, Database } from 'lucide-react'

interface ImportarClientesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'upload' | 'mapping' | 'preview'

export function ImportarClientesDialog({ open, onOpenChange }: ImportarClientesDialogProps) {
  const { toast } = useToast()
  const importClientes = useImportClientes()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [sheetData, setSheetData] = useState<any[]>([])

  // Mapeamento de colunas: Campo do Banco -> Coluna do Excel
  const [mapping, setMapping] = useState({
    nome: '',
    telefone: 'ignore',
    email: 'ignore',
    observacoes: 'ignore'
  })

  const resetState = () => {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setSheetData([])
    setMapping({
      nome: '',
      telefone: 'ignore',
      email: 'ignore',
      observacoes: 'ignore'
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (data.length === 0) {
          throw new Error('A planilha está vazia.')
        }

        const excelHeaders = (data[0] as any[]).map(h => String(h).trim())
        setHeaders(excelHeaders)

        const rows = XLSX.utils.sheet_to_json(worksheet)
        setSheetData(rows)

        // Mapeamento inteligente automático
        const newMapping = { nome: '', telefone: 'ignore', email: 'ignore', observacoes: 'ignore' }
        excelHeaders.forEach(h => {
          const lower = h.toLowerCase()
          if (lower.includes('nome') || lower.includes('name') || lower.includes('cliente') || lower === 'nome_cliente') {
            newMapping.nome = h
          } else if (lower.includes('tel') || lower.includes('fone') || lower.includes('cel') || lower.includes('phone') || lower.includes('contato')) {
            newMapping.telefone = h
          } else if (lower.includes('mail') || lower === 'email') {
            newMapping.email = h
          } else if (lower.includes('obs') || lower.includes('nota') || lower.includes('coment') || lower.includes('observ')) {
            newMapping.observacoes = h
          }
        })
        setMapping(newMapping)
        setStep('mapping')
      } catch (err: any) {
        toast({
          title: 'Erro ao ler arquivo',
          description: err.message || 'Verifique se o arquivo está no formato correto (XLSX, XLS ou CSV).',
          variant: 'destructive'
        })
        resetState()
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleNextStep = () => {
    if (!mapping.nome) {
      toast({
        title: 'Mapeamento incompleto',
        description: 'Você precisa mapear obrigatoriamente a coluna correspondente ao "Nome" do cliente.',
        variant: 'destructive'
      })
      return
    }
    setStep('preview')
  }

  // Gera lista final de clientes com base no mapeamento
  const getMappedClients = () => {
    return sheetData.map(row => {
      const nome = row[mapping.nome] ? String(row[mapping.nome]).trim() : ''
      const telefone = mapping.telefone && mapping.telefone !== 'ignore' && row[mapping.telefone] ? String(row[mapping.telefone]).trim() : ''
      const email = mapping.email && mapping.email !== 'ignore' && row[mapping.email] ? String(row[mapping.email]).trim() : ''
      const observacoes = mapping.observacoes && mapping.observacoes !== 'ignore' && row[mapping.observacoes] ? String(row[mapping.observacoes]).trim() : ''

      return {
        nome,
        telefone: telefone || '',
        email: email || null,
        observacoes: observacoes || null
      }
    }).filter(c => c.nome.length > 0) // Remove linhas que ficaram com nome vazio
  }

  const finalClients = getMappedClients()

  const handleConfirmImport = async () => {
    if (finalClients.length === 0) {
      toast({
        title: 'Nenhum cliente para importar',
        description: 'Verifique se a coluna do Nome está mapeada corretamente e possui registros preenchidos.',
        variant: 'destructive'
      })
      return
    }

    try {
      await importClientes.mutateAsync(finalClients)
      toast({
        title: 'Importação concluída!',
        description: `Sucesso ao importar ${finalClients.length} clientes para o sistema.`,
      })
      onOpenChange(false)
      resetState()
    } catch (err: any) {
      toast({
        title: 'Erro ao importar clientes',
        description: err.message || 'Ocorreu um erro no salvamento em lote.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v)
      if (!v) resetState()
    }}>
      <DialogContent className="max-w-md md:max-w-lg rounded-xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Importar Clientes via Planilha
          </DialogTitle>
          <DialogDescription className="text-xs">
            Importe dados de clientes de forma segura a partir de planilhas Excel (XLSX, XLS) ou CSV.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-accent/10">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-xs font-semibold text-foreground text-center">Selecione o arquivo Excel ou CSV</p>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">Formatos suportados: .xlsx, .xls, .csv</p>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()} 
              className="mt-4 h-8 px-4 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
            >
              Escolher Arquivo
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-accent/20 rounded-lg border border-border flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div className="leading-none">
                <p className="text-xs font-semibold truncate max-w-[280px]">{fileName}</p>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{sheetData.length} registros encontrados</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">Mapeamento de Campos</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-foreground">Nome (Obrigatório)</Label>
                  <Select 
                    value={mapping.nome} 
                    onValueChange={(val) => setMapping(prev => ({ ...prev, nome: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-border">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-foreground">Telefone</Label>
                  <Select 
                    value={mapping.telefone} 
                    onValueChange={(val) => setMapping(prev => ({ ...prev, telefone: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-border">
                      <SelectValue placeholder="Ignorar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignorar Campo</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-foreground">Email</Label>
                  <Select 
                    value={mapping.email} 
                    onValueChange={(val) => setMapping(prev => ({ ...prev, email: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-border">
                      <SelectValue placeholder="Ignorar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignorar Campo</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-foreground">Observações</Label>
                  <Select 
                    value={mapping.observacoes} 
                    onValueChange={(val) => setMapping(prev => ({ ...prev, observacoes: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-border">
                      <SelectValue placeholder="Ignorar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignorar Campo</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetState} 
                className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >
                Voltar
              </Button>
              <Button 
                size="sm"
                onClick={handleNextStep} 
                className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >
                Visualizar Prévia
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-violet-600" />
              <div className="leading-none">
                <p className="text-xs font-semibold">Prévia da Importação</p>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                  {finalClients.length} de {sheetData.length} clientes válidos para importação.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">Primeiros 5 Registros</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-accent/20 font-bold border-b border-border text-muted-foreground uppercase text-[9px]">
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Telefone</th>
                      <th className="px-3 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {finalClients.slice(0, 5).map((c, i) => (
                      <tr key={i} className="hover:bg-accent/5">
                        <td className="px-3 py-2 font-semibold text-foreground truncate max-w-[120px]">{c.nome}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[100px]">{c.telefone || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{c.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {finalClients.length > 5 && (
                <p className="text-[9px] text-muted-foreground italic text-center mt-1">E mais {finalClients.length - 5} clientes adicionais...</p>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStep('mapping')} 
                className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >
                Voltar Mapeamento
              </Button>
              <Button 
                size="sm"
                onClick={handleConfirmImport}
                disabled={importClientes.isPending}
                className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg"
              >
                {importClientes.isPending ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
