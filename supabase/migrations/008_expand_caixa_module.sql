-- Migração para Módulo de Caixa Profissional

-- 1. Criar tabela de controle de abertura/fechamento
CREATE TABLE IF NOT EXISTS caixa_diario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  usuario_abertura_id UUID NOT NULL REFERENCES usuario(id),
  usuario_fechamento_id UUID REFERENCES usuario(id),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  valor_inicial NUMERIC(10, 2) NOT NULL DEFAULT 0,
  valor_fechamento_informado NUMERIC(10, 2),
  valor_fechamento_sistema NUMERIC(10, 2),
  status TEXT NOT NULL CHECK (status IN ('aberto', 'fechado')) DEFAULT 'aberto',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar novas colunas na tabela transacao_caixa
ALTER TABLE transacao_caixa ADD COLUMN IF NOT EXISTS caixa_id UUID REFERENCES caixa_diario(id);
ALTER TABLE transacao_caixa ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'estornado'));
ALTER TABLE transacao_caixa ADD COLUMN IF NOT EXISTS taxa_cartao NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE transacao_caixa ADD COLUMN IF NOT EXISTS comissao_valor NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE transacao_caixa ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_caixa_diario_salao ON caixa_diario(salao_id);
CREATE INDEX IF NOT EXISTS idx_transacao_caixa_caixa_id ON transacao_caixa(caixa_id);

-- 4. Adicionar comissão aos serviços
ALTER TABLE servico ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5, 2) DEFAULT 0;

-- 5. Trigger para updated_at no caixa_diario
CREATE TRIGGER update_caixa_diario_updated_at BEFORE UPDATE ON caixa_diario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
