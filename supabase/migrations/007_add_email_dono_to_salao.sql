-- Adicionar coluna para armazenar o e-mail do dono antes do vínculo oficial
ALTER TABLE salao ADD COLUMN IF NOT EXISTS email_dono TEXT;

-- Comentário para documentação
COMMENT ON COLUMN salao.email_dono IS 'E-mail do proprietário que será convidado para gerenciar este salão';
