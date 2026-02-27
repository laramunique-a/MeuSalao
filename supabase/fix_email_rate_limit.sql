-- ========================================
-- SOLUÇÃO: Email Rate Limit Exceeded
-- ========================================
-- Este script configura o Supabase para auto-confirmar
-- usuários durante o desenvolvimento, evitando o limite
-- de emails do plano gratuito.

-- OPÇÃO 1: Desabilitar Confirmação de Email (Recomendado para Desenvolvimento)
-- Execute este comando no SQL Editor do Supabase:

-- Atenção: Este script deve ser executado como Administrador no Supabase Dashboard
-- Vá em: Authentication > Settings > Email Auth

-- No painel do Supabase, siga estas etapas:
-- 1. Vá em "Authentication" no menu lateral
-- 2. Clique em "Settings"
-- 3. Role até "Email Auth"
-- 4. DESABILITE "Enable email confirmations"
-- 5. Clique em "Save"

-- Alternativamente, você pode confirmar usuários manualmente via SQL:

-- Para confirmar um usuário específico (substitua o email):
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'dasvirg@gmail.com';

-- Para confirmar TODOS os usuários pendentes (use com cuidado!):
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- ========================================
-- OPÇÃO 2: Aumentar Rate Limit (Apenas em Produção)
-- ========================================
-- Se você estiver em produção e precisar criar muitos usuários:
-- 1. Considere fazer upgrade para um plano pago no Supabase
-- 2. Ou implemente um sistema de convites assíncronos
-- 3. Ou crie os usuários manualmente pelo painel do Supabase

-- ========================================
-- VERIFICAR USUÁRIOS CRIADOS
-- ========================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  usr.nome,
  usr.perfil,
  usr.ativo
FROM auth.users u
LEFT JOIN public.usuario usr ON usr.auth_user_id = u.id
ORDER BY u.created_at DESC;
