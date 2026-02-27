-- ================================================================
-- CORREÇÃO DEFINITIVA E RESET DE POLÍTICAS: TABELA USUARIO
-- ================================================================

-- 1. Desabilitar RLS momentaneamente para limpar tudo com segurança
ALTER TABLE usuario DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as possíveis políticas antigas (inclusive as com outros nomes)
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
DROP POLICY IF EXISTS "usuario_insert_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_select_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_update_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_delete_policy" ON usuario;

-- 3. Habilitar RLS novamente
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

-- 4. Criar política de SELECT (Essencial para o comando .select() do JS funcionar)
CREATE POLICY "usuários podem ver colegas de salão"
  ON usuario FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- 5. Criar política de INSERT (A mais crítica)
-- Usamos a lógica baseada no salao_id do administrador logado
CREATE POLICY "admins podem inserir novos usuários"
  ON usuario FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );

-- 6. Criar políticas de UPDATE e DELETE
CREATE POLICY "admins podem editar usuários"
  ON usuario FOR UPDATE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );

CREATE POLICY "admins podem remover usuários"
  ON usuario FOR DELETE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
    )
  );

-- 7. Verificar se o seu usuário atual é realmente um administrador
-- Execute esta linha abaixo separadamente se quiser confirmar seu status:
-- SELECT email, perfil FROM usuario WHERE auth_user_id = auth.uid();
