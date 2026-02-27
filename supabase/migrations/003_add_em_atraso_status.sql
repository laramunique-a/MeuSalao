-- Adicionar status 'em_atraso' ao CHECK constraint da tabela agendamento

-- Remover constraint antiga
ALTER TABLE agendamento DROP CONSTRAINT IF EXISTS agendamento_status_check;

-- Adicionar nova constraint com 'em_atraso'
ALTER TABLE agendamento ADD CONSTRAINT agendamento_status_check 
  CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'em_atraso', 'concluido', 'cancelado'));
