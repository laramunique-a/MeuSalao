-- Criar tabela bloqueio_agenda

CREATE TABLE bloqueio_agenda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_data_fim_maior CHECK (data_fim >= data_inicio),
  CONSTRAINT check_horario_fim_maior CHECK (horario_fim > horario_inicio)
);

-- Índices
CREATE INDEX idx_bloqueio_salao ON bloqueio_agenda(salao_id);
CREATE INDEX idx_bloqueio_profissional ON bloqueio_agenda(profissional_id);
CREATE INDEX idx_bloqueio_data ON bloqueio_agenda(data_inicio, data_fim);

-- Trigger para updated_at
CREATE TRIGGER update_bloqueio_agenda_updated_at BEFORE UPDATE ON bloqueio_agenda
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE bloqueio_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY bloqueio_agenda_select_policy ON bloqueio_agenda
  FOR SELECT
  USING (
    salao_id IN (
      SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY bloqueio_agenda_insert_policy ON bloqueio_agenda
  FOR INSERT
  WITH CHECK (
    salao_id IN (
      SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY bloqueio_agenda_update_policy ON bloqueio_agenda
  FOR UPDATE
  USING (
    salao_id IN (
      SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    salao_id IN (
      SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY bloqueio_agenda_delete_policy ON bloqueio_agenda
  FOR DELETE
  USING (
    salao_id IN (
      SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
    )
  );
