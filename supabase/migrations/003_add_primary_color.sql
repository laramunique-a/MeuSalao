-- Adicionar campo de cor principal nas configurações do salão
ALTER TABLE salao 
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#9333ea';

-- Atualizar salões existentes com a cor padrão (roxo)
UPDATE salao 
SET cor_primaria = '#9333ea' 
WHERE cor_primaria IS NULL;
