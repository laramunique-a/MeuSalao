-- Criar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela salao
CREATE TABLE salao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  logo_url TEXT,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela usuario
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('administrador', 'funcionario')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id)
);

-- Tabela cliente
CREATE TABLE cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela servico
CREATE TABLE servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(10, 2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela agendamento
CREATE TABLE agendamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado')),
  valor NUMERIC(10, 2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela transacao_caixa
CREATE TABLE transacao_caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES agendamento(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC(10, 2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'outros')),
  categoria TEXT,
  descricao TEXT NOT NULL,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_usuario_salao ON usuario(salao_id);
CREATE INDEX idx_usuario_auth ON usuario(auth_user_id);
CREATE INDEX idx_cliente_salao ON cliente(salao_id);
CREATE INDEX idx_servico_salao ON servico(salao_id);
CREATE INDEX idx_agendamento_salao ON agendamento(salao_id);
CREATE INDEX idx_agendamento_data ON agendamento(data_hora);
CREATE INDEX idx_agendamento_profissional ON agendamento(profissional_id);
CREATE INDEX idx_transacao_salao ON transacao_caixa(salao_id);
CREATE INDEX idx_transacao_data ON transacao_caixa(data_hora);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_salao_updated_at BEFORE UPDATE ON salao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_updated_at BEFORE UPDATE ON cliente
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servico_updated_at BEFORE UPDATE ON servico
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamento_updated_at BEFORE UPDATE ON agendamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
