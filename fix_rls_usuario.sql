-- ================================================================
-- CORREÇÃO DEFINITIVA: POLÍTICAS DE INSERÇÃO NA TABELA USUARIO
-- ================================================================

-- 1. Remover a política antiga que pode estar causando ambiguidade ou recursão no INSERT
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;

-- 2. Criar uma nova política usando um padrão mais robusto (igual ao da tabela cliente)
-- Isso evita a ambiguidade do campo 'salao_id' e garante que o Supabase 
-- valide corretamente se quem está tentando inserir é um ADMIN do salão em questão.
CREATE POLICY "Administradores podem inserir usuários"
  ON usuario FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );

-- 3. Garantir que as políticas de UPDATE/DELETE também sejam robustas
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
CREATE POLICY "Administradores podem atualizar usuários"
  ON usuario FOR UPDATE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );

DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
CREATE POLICY "Administradores podem deletar usuários"
  ON usuario FOR DELETE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );
