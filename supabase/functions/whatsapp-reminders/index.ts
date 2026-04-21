import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || ""

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Calcular data de amanhã
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startDate = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString()
    const endDate = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()

    console.log(`Buscando agendamentos entre ${startDate} e ${endDate}`)

    // 2. Buscar agendamentos pendentes para amanhã com dados do cliente e salão
    const { data: agendamentos, error: fetchError } = await supabase
      .from('agendamento')
      .select(`
        id,
        data_hora,
        salao_id,
        status,
        cliente:cliente_id (nome, telefone),
        servico:servico_id (nome),
        salao:salao_id (nome)
      `)
      .eq('status', 'agendado')
      .gte('data_hora', startDate)
      .lte('data_hora', endDate)

    if (fetchError) throw fetchError

    console.log(`Encontrados ${agendamentos?.length || 0} agendamentos para notificar.`)

    const results = []

    // 3. Processar cada agendamento
    for (const ag of (agendamentos || [])) {
      if (!ag.cliente?.telefone) continue

      // Buscar config de WhatsApp do salão
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('salao_id', ag.salao_id)
        .eq('status', 'connected')
        .single()

      if (!config) {
        console.warn(`Salão ${ag.salao_id} não tem WhatsApp conectado. Pulando.`)
        continue
      }

      // Formatar número
      const cleanNumber = ag.cliente.telefone.replace(/\D/g, '')
      const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`

      const dataHora = new Date(ag.data_hora)
      const dataFormatada = dataHora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      const mensagem = `⏰ *Lembrete de Agendamento*\n\nOlá, *${ag.cliente.nome}*!\nPassando para lembrar do seu horário de amanhã no *${ag.salao.nome}*.\n\n📅 *Data:* ${dataFormatada} às ${horaFormatada}\n✂️ *Serviço:* ${ag.servico.nome}\n\nTe esperamos! Se precisar desmarcar, por favor nos avise. 🙏`

      // Enviar via Evolution API
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${config.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apikey
        },
        body: JSON.stringify({
          number: formattedNumber,
          textMessage: { text: mensagem }
        })
      })

      results.push({
        agendamento_id: ag.id,
        success: response.ok,
        status: response.status
      })

      // Logar no banco
      await supabase.from('notificacao_log').insert({
        agendamento_id: ag.id,
        salao_id: ag.salao_id,
        tipo: 'lembrete',
        status: response.ok ? 'sucesso' : 'erro'
      })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
