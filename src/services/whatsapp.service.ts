import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL
const EVOLUTION_GLOBAL_KEY = import.meta.env.VITE_EVOLUTION_GLOBAL_API_KEY

export interface WhatsAppConfig {
  id: string
  salao_id: string
  instance_name: string
  apikey: string
  status: 'connected' | 'disconnected'
}

export const whatsappService = {
  async getConfig(salaoId?: string): Promise<WhatsAppConfig | null> {
    const sId = salaoId || useAuthStore.getState().usuario?.salao_id
    if (!sId) return null

    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('salao_id', sId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async createInstance(salaoId: string) {
    const instanceName = `salao_${salaoId.split('-')[0]}_${Date.now().toString().slice(-4)}`
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_GLOBAL_KEY
      },
      body: JSON.stringify({
        instanceName,
        token: Math.random().toString(36).substring(7),
        qrcode: true
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Erro ao criar instância no Evolution API')

    // Salvar no banco
    const { error: dbError } = await supabase
      .from('whatsapp_config')
      .upsert({
        salao_id: salaoId,
        instance_name: data.hash.instanceName,
        apikey: data.hash.apikey,
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })

    if (dbError) throw dbError
    return data
  },

  async getQRCode(instanceName: string, apikey: string) {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apikey
      }
    })

    const data = await response.json()
    if (!response.ok) throw new Error('Erro ao buscar QR Code')
    return data // Geralmente retorna base64 ou link
  },

  async sendText(salaoId: string, to: string, text: string) {
    const config = await this.getConfig(salaoId)
    if (!config || config.status !== 'connected') {
      console.warn('WhatsApp não configurado ou desconectado para o salão:', salaoId)
      return
    }

    // Formatar número para o padrão WhatsApp (remover caracteres não numéricos)
    const cleanNumber = to.replace(/\D/g, '')
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`

    try {
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${config.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apikey
        },
        body: JSON.stringify({
          number: formattedNumber,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false
          },
          textMessage: {
            text: text
          }
        })
      })

      const result = await response.json()
      
      // Logar a notificação
      await supabase.from('notificacao_log').insert({
        salao_id: salaoId,
        tipo: 'whatsapp',
        status: response.ok ? 'sucesso' : 'erro',
        detalhes: JSON.stringify(result)
      })

      return result
    } catch (error: any) {
      console.error('Erro ao enviar WhatsApp:', error)
      await supabase.from('notificacao_log').insert({
        salao_id: salaoId,
        tipo: 'whatsapp',
        status: 'erro',
        detalhes: error.message
      })
    }
  },

  async checkStatus(instanceName: string, apikey: string) {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apikey
      }
    })

    if (!response.ok) return 'disconnected'
    const data = await response.json()
    return data.instance.state // 'open', 'close', etc
  }
}
