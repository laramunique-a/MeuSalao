-- Migração: adicionar campo 'pode_atender' para controlar se um usuário
-- (especialmente administradores) pode realizar atendimentos e receber comissões.

-- 1. Adicionar a coluna 'pode_atender' (padrão false)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS pode_atender BOOLEAN NOT NULL DEFAULT false;

-- 2. Todos os 'profissional' existentes devem ter pode_atender = true
UPDATE usuario SET pode_atender = true WHERE perfil = 'profissional';
