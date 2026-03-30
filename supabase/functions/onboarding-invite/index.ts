import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { salao_id, email } = await req.json()

  // Inicializa Supabase com SERVICE_ROLE (seguro no servidor)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Convida o usuário via e-mail
  // Passamos o salao_id no metadata para o trigger saber onde vincular
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { salao_id: salao_id }
  })

  if (inviteError) return new Response(JSON.stringify(inviteError), { status: 400 })

  return new Response(JSON.stringify({ message: "Convite enviado!" }), { status: 200 })
})
