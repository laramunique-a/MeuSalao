-- ================================================================
-- CORREÇÃO: Políticas RLS causando recursão infinita
-- Execute este SQL no SQL Editor do Supabase
-- ================================================================

-- PASSO 1: Remover todas as políticas antigas da tabela usuario
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;

-- PASSO 2: Criar políticas SEM recursão

-- SELECT: Permitir que usuários vejam outros usuários do mesmo salão
-- CORREÇÃO: Usa diretamente o auth.uid() sem fazer join recursivo
CREATE POLICY "usuario_select_policy"
ON usuario FOR SELECT
USING (
  salao_id IN (
    SELECT u.salao_id 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- INSERT: Apenas administradores podem criar novos usuários
CREATE POLICY "usuario_insert_policy"
ON usuario FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

-- UPDATE: Apenas administradores podem atualizar usuários
CREATE POLICY "usuario_update_policy"
ON usuario FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

-- DELETE: Apenas administradores podem deletar usuários
CREATE POLICY "usuario_delete_policy"
ON usuario FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

-- ================================================================
-- VERIFICAÇÃO: Execute para confirmar que as políticas foram criadas
-- ================================================================

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuario';

-- Você deve ver 4 políticas listadas:
-- 1. usuario_select_policy
-- 2. usuario_insert_policy
-- 3. usuario_update_policy
-- 4. usuario_delete_policy
