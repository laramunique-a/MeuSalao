-- ================================================================
-- Migração: 014_create_pagamento_comissao.sql
-- Módulo de Pagamento de Comissões Desacoplado do Caixa Diário
-- ================================================================

-- 1. Criar tabela de pagamento_comissao
CREATE TABLE IF NOT EXISTS pagamento_comissao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuario(id),
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  forma_pagamento TEXT NOT NULL DEFAULT 'pix' CHECK (forma_pagamento IN ('pix', 'transferencia', 'dinheiro', 'outros')),
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'estornado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamento_comissao_salao ON pagamento_comissao(salao_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_comissao_profissional ON pagamento_comissao(profissional_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_comissao_data ON pagamento_comissao(data_pagamento);

-- 3. Trigger para updated_at
CREATE TRIGGER update_pagamento_comissao_updated_at BEFORE UPDATE ON pagamento_comissao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE pagamento_comissao ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver pagamentos de comissão do seu salão"
  ON pagamento_comissao FOR SELECT
  USING (
    salao_id IN (
      SELECT u.salao_id 
      FROM usuario u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Administradores podem inserir pagamentos de comissão"
  ON pagamento_comissao FOR INSERT
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

CREATE POLICY "Administradores podem atualizar pagamentos de comissão"
  ON pagamento_comissao FOR UPDATE
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

-- 5. Migração de dados legados (Opcional/Seguro):
-- Copia pagamentos de comissão que foram gravados anteriormente em transacao_caixa
INSERT INTO pagamento_comissao (
  id,
  salao_id,
  profissional_id,
  usuario_id,
  valor,
  forma_pagamento,
  data_pagamento,
  observacoes,
  status,
  created_at,
  updated_at
)
SELECT 
  t.id,
  t.salao_id,
  (t.metadata->>'profissional_id')::uuid AS profissional_id,
  t.usuario_id,
  t.valor,
  CASE 
    WHEN t.forma_pagamento IN ('pix', 'transferencia', 'dinheiro') THEN t.forma_pagamento
    ELSE 'pix'
  END AS forma_pagamento,
  t.data_hora AS data_pagamento,
  t.descricao AS observacoes,
  CASE 
    WHEN t.status = 'estornado' THEN 'estornado'
    ELSE 'pago'
  END AS status,
  t.created_at,
  NOW() AS updated_at
FROM transacao_caixa t
WHERE t.categoria = 'Pagamento de Comissão'
  AND t.metadata->>'profissional_id' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pagamento_comissao pc WHERE pc.id = t.id
  );
