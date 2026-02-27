-- ================================================================
-- CORREÇÃO DE EMERGÊNCIA: ELIMINAR RECURSÃO INFINITA
-- ================================================================

-- 1. Limpar funções e políticas problemáticas
DROP POLICY IF EXISTS "usuários podem ver colegas de salão" ON usuario;
DROP POLICY IF EXISTS "admins podem inserir novos usuários" ON usuario;
DROP POLICY IF EXISTS "admins podem editar usuários" ON usuario;
DROP POLICY IF EXISTS "admins podem remover usuários" ON usuario;
DROP FUNCTION IF EXISTS get_my_salao_id();

-- 2. Criar uma função com "SECURITY DEFINER" para recuperar o salão do usuário logado.
-- O "SECURITY DEFINER" faz com que a função ignore o RLS, quebrando a recursão infinita.
CREATE OR REPLACE FUNCTION get_my_salao_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT salao_id FROM public.usuario WHERE auth_user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Habilitar RLS (caso tenha sido desativado)
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

-- 4. Criar política de SELECT segura (usando a função para evitar recursão)
CREATE POLICY "usuario_select_safe"
  ON usuario FOR SELECT
  USING (
    auth_user_id = auth.uid() OR -- Próprio usuário
    salao_id = get_my_salao_id() -- Outros usuários do mesmo salão
  );

-- 5. Criar política de INSERT segura
CREATE POLICY "usuario_insert_safe"
  ON usuario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuario 
      WHERE auth_user_id = auth.uid() 
        AND perfil = 'administrador'
        AND salao_id = usuario.salao_id
    )
  );

-- 6. Criar políticas de UPDATE e DELETE seguras
CREATE POLICY "usuario_update_safe"
  ON usuario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario 
      WHERE auth_user_id = auth.uid() 
        AND perfil = 'administrador'
        AND salao_id = usuario.salao_id
    )
  );

CREATE POLICY "usuario_delete_safe"
  ON usuario FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario 
      WHERE auth_user_id = auth.uid() 
        AND perfil = 'administrador'
        AND salao_id = usuario.salao_id
    )
  );

-- 7. RECOMENDAÇÃO: Verifique se o salão do seu usuário não está nulo no Supabase
-- SELECT email, salao_id FROM usuario WHERE auth_user_id = auth.uid();
