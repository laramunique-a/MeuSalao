-- 1. Criar funções "security definer" para buscar dados do usuário atual sem disparar RLS
-- Isso resolve o erro de "infinite recursion"

CREATE OR REPLACE FUNCTION get_my_salao_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario 
    WHERE auth_user_id = auth.uid() 
    AND perfil = 'super_admin'
  );
$$;

-- 2. Corrigir as políticas da tabela 'usuario' que causavam a recursão
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
CREATE POLICY "Usuários podem ver usuários do mesmo salão"
  ON usuario FOR SELECT
  USING (
    auth_user_id = auth.uid() -- Ver a si mesmo
    OR 
    salao_id = get_my_salao_id() -- Ver outros do mesmo salão
    OR 
    is_super_admin() -- Super Admin vê tudo
  );

DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
CREATE POLICY "Administradores podem inserir usuários"
  ON usuario FOR INSERT
  WITH CHECK (
    is_super_admin() 
    OR 
    (perfil = 'funcionario' AND salao_id = get_my_salao_id())
    OR
    (perfil = 'administrador' AND salao_id = get_my_salao_id())
  );

DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
CREATE POLICY "Administradores podem atualizar usuários"
  ON usuario FOR UPDATE
  USING (
    is_super_admin()
    OR
    (salao_id = get_my_salao_id())
  );

DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
CREATE POLICY "Administradores podem deletar usuários"
  ON usuario FOR DELETE
  USING (
    is_super_admin()
    OR
    (salao_id = get_my_salao_id())
  );

-- 3. Atualizar outras tabelas para usar as funções (mais performático e seguro)
DROP POLICY IF EXISTS "Usuários podem ver seu próprio salão" ON salao;
CREATE POLICY "Usuários podem ver seu próprio salão"
  ON salao FOR SELECT
  USING (
    id = get_my_salao_id() 
    OR 
    is_super_admin()
  );

DROP POLICY IF EXISTS "Usuários podem ver clientes do mesmo salão" ON cliente;
CREATE POLICY "Usuários podem ver clientes do mesmo salão"
  ON cliente FOR SELECT
  USING (
    salao_id = get_my_salao_id() 
    OR 
    is_super_admin()
  );

DROP POLICY IF EXISTS "Usuários podem ver agendamentos do mesmo salão" ON agendamento;
CREATE POLICY "Usuários podem ver agendamentos do mesmo salão"
  ON agendamento FOR SELECT
  USING (
    salao_id = get_my_salao_id() 
    OR 
    is_super_admin()
  );
