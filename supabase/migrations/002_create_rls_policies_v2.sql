-- ================================================================
-- POLÍTICAS RLS CORRIGIDAS - SEM RECURSÃO
-- Este arquivo substitui completamente o 002_create_rls_policies.sql
-- Execute este SQL se você ainda NÃO executou as migrations
-- ================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE salao ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacao_caixa ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- TABELA: salao
-- ================================================================

CREATE POLICY "Usuários podem ver seu próprio salão"
  ON salao FOR SELECT
  USING (
    id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem atualizar salão"
  ON salao FOR UPDATE
  USING (
    id IN (
      SELECT u.salao_id 
      FROM usuario u
      WHERE u.auth_user_id = auth.uid() 
        AND u.perfil = 'administrador'
      LIMIT 1
    )
  );

-- ================================================================
-- TABELA: usuario
-- ================================================================

CREATE POLICY "Usuários podem ver usuários do mesmo salão"
  ON usuario FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem inserir usuários"
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

CREATE POLICY "Administradores podem atualizar usuários"
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

CREATE POLICY "Administradores podem deletar usuários"
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
-- TABELA: cliente
-- ================================================================

CREATE POLICY "Usuários podem ver clientes do mesmo salão"
  ON cliente FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Usuários podem inserir clientes"
  ON cliente FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Usuários podem atualizar clientes"
  ON cliente FOR UPDATE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem deletar clientes"
  ON cliente FOR DELETE
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
-- TABELA: servico
-- ================================================================

CREATE POLICY "Usuários podem ver serviços do mesmo salão"
  ON servico FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem inserir serviços"
  ON servico FOR INSERT
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

CREATE POLICY "Administradores podem atualizar serviços"
  ON servico FOR UPDATE
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

CREATE POLICY "Administradores podem deletar serviços"
  ON servico FOR DELETE
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
-- TABELA: agendamento
-- ================================================================

CREATE POLICY "Usuários podem ver agendamentos do mesmo salão"
  ON agendamento FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Usuários podem inserir agendamentos"
  ON agendamento FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Usuários podem atualizar agendamentos"
  ON agendamento FOR UPDATE
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem deletar agendamentos"
  ON agendamento FOR DELETE
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
-- TABELA: transacao_caixa
-- ================================================================

CREATE POLICY "Usuários podem ver transações do mesmo salão"
  ON transacao_caixa FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Usuários podem inserir transações"
  ON transacao_caixa FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
    AND usuario_id IN (
      SELECT u.id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem atualizar transações"
  ON transacao_caixa FOR UPDATE
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

CREATE POLICY "Administradores podem deletar transações"
  ON transacao_caixa FOR DELETE
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
