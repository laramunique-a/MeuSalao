-- Adicionar coluna de comissão na tabela de usuários
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5, 2) DEFAULT 0;

-- (Opcional) Poderíamos remover da tabela de serviços, 
-- mas manteremos por enquanto para evitar quebras de código antes do deploy do frontend.
-- ALTER TABLE servico DROP COLUMN IF EXISTS comissao_percentual;
