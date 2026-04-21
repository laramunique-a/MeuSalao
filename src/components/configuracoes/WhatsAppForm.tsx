import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { whatsappService, WhatsAppConfig } from '@/services/whatsapp.service'
import { Loader2, CheckCircle2, QrCode, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Salao } from '@/types/models'

interface WhatsAppFormProps {
  salao: Salao
}

export function WhatsAppForm({ salao }: WhatsAppFormProps) {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await whatsappService.getConfig(salao.id)
      setConfig(data)
      
      if (data && data.status === 'disconnected') {
        // Tentar buscar QR Code se estiver desconectado
        fetchQRCode(data.instance_name, data.apikey)
      }
    } catch (error) {
      console.error('Erro ao carregar config WhatsApp:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQRCode = async (instanceName: string, apikey: string) => {
    try {
      const data = await whatsappService.getQRCode(instanceName, apikey)
      if (data && data.base64) {
        setQrCode(data.base64)
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error)
    }
  }

  const handleCreateInstance = async () => {
    try {
      setConnecting(true)
      const data = await whatsappService.createInstance(salao.id)
      const newConfig: WhatsAppConfig = {
        id: '', // será carregado no refresh
        salao_id: salao.id,
        instance_name: data.hash.instanceName,
        apikey: data.hash.apikey,
        status: 'disconnected'
      }
      setConfig(newConfig)
      if (data.qrcode && data.qrcode.base64) {
        setQrCode(data.qrcode.base64)
      }
      toast({
        title: 'Instância criada!',
        description: 'Escaneie o QR Code para conectar seu WhatsApp.'
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar instância',
        description: error.message
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleRefreshStatus = async () => {
    if (!config) return
    try {
      setLoading(true)
      const state = await whatsappService.checkStatus(config.instance_name, config.apikey)
      if (state === 'open') {
        toast({ title: 'WhatsApp Conectado!' })
        loadConfig()
      } else {
        toast({ description: 'Aguardando leitura do QR Code...' })
        fetchQRCode(config.instance_name, config.apikey)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [salao.id])

  if (loading && !config) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card className="border-border/50 shadow-xl shadow-primary/5 overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 py-6 px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight">Status do WhatsApp</CardTitle>
              <CardDescription className="text-sm font-medium">Cada salão usa seu próprio número para enviar notificações.</CardDescription>
            </div>
            {config && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStatus}
                className="rounded-xl border-primary/20 hover:bg-primary/5 font-bold"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Status
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {!config ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">WhatsApp não configurado</h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-sm font-medium leading-relaxed">
                Conecte o WhatsApp do seu estabelecimento para enviar confirmações de agendamento e lembretes automáticos para seus clientes.
              </p>
              <Button 
                onClick={handleCreateInstance} 
                className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                disabled={connecting}
              >
                {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar WhatsApp Agora
              </Button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${config.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                      {config.status === 'connected' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Loader2 className="h-6 w-6 text-yellow-600 dark:text-yellow-400 animate-spin" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-lg">
                        {config.status === 'connected' ? 'Conectado' : 'Aguardando Conexão'}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Instância: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold">{config.instance_name}</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                  <h4 className="font-bold text-sm mb-3">O que as notificações fazem por você?</h4>
                  <ul className="space-y-2 text-xs font-medium text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Reduz em até 40% as faltas (No-show)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Passa mais profissionalismo para o seu cliente
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Confirmação automática direto no celular
                    </li>
                  </ul>
                </div>
              </div>

              {config.status !== 'connected' && qrCode && (
                <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl shadow-2xl border border-border/50">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                    Escaneie com o WhatsApp
                  </p>
                </div>
              )}

              {config.status === 'connected' && (
                <div className="w-full md:w-auto flex flex-col items-center justify-center p-12 bg-green-500/5 rounded-3xl border border-green-500/20">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-green-600 dark:text-green-400 font-black text-center">Tudo pronto!</p>
                  <p className="text-xs text-muted-foreground font-medium text-center max-w-[150px] mt-1">
                    Seu sistema está disparando mensagens automaticamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
