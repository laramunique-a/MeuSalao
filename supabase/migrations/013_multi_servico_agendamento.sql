-- 013_multi_servico_agendamento.sql
-- Tabela para armazenar múltiplos serviços e profissionais associados a um único agendamento

CREATE TABLE IF NOT EXISTS agendamento_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servico(id),
  profissional_id UUID NOT NULL REFERENCES usuario(id),
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  duracao_minutos INT NOT NULL DEFAULT 30,
  comissao_percentual DECIMAL(5,2),
  comissao_valor DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para otimizar busca por agendamento_id e profissional_id
CREATE INDEX IF NOT EXISTS idx_agendamento_servico_agendamento_id ON agendamento_servico(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_servico_profissional_id ON agendamento_servico(profissional_id);

-- Habilitar RLS
ALTER TABLE agendamento_servico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS baseadas no salão do agendamento pai
DROP POLICY IF EXISTS "Usuários podem ver itens de agendamentos do mesmo salão" ON agendamento_servico;
CREATE POLICY "Usuários podem ver itens de agendamentos do mesmo salão"
  ON agendamento_servico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agendamento
      WHERE agendamento.id = agendamento_servico.agendamento_id
      AND (agendamento.salao_id = get_my_salao_id() OR is_super_admin())
    )
  );

DROP POLICY IF EXISTS "Usuários podem inserir itens de agendamentos do mesmo salão" ON agendamento_servico;
CREATE POLICY "Usuários podem inserir itens de agendamentos do mesmo salão"
  ON agendamento_servico FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agendamento
      WHERE agendamento.id = agendamento_servico.agendamento_id
      AND (agendamento.salao_id = get_my_salao_id() OR is_super_admin())
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar itens de agendamentos do mesmo salão" ON agendamento_servico;
CREATE POLICY "Usuários podem atualizar itens de agendamentos do mesmo salão"
  ON agendamento_servico FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agendamento
      WHERE agendamento.id = agendamento_servico.agendamento_id
      AND (agendamento.salao_id = get_my_salao_id() OR is_super_admin())
    )
  );

DROP POLICY IF EXISTS "Usuários podem deletar itens de agendamentos do mesmo salão" ON agendamento_servico;
CREATE POLICY "Usuários podem deletar itens de agendamentos do mesmo salão"
  ON agendamento_servico FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agendamento
      WHERE agendamento.id = agendamento_servico.agendamento_id
      AND (agendamento.salao_id = get_my_salao_id() OR is_super_admin())
    )
  );
