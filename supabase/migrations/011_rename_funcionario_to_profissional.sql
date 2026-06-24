-- Migração para renomear o perfil 'funcionario' para 'profissional'

-- 1. Remover a restrição antiga primeiro para permitir a alteração dos valores
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_perfil_check;

-- 2. Atualizar quaisquer registros existentes (se houver)
UPDATE usuario SET perfil = 'profissional' WHERE perfil = 'funcionario';

-- 3. Adicionar a nova restrição de perfil
ALTER TABLE usuario ADD CONSTRAINT usuario_perfil_check CHECK (perfil IN ('administrador', 'profissional', 'super_admin'));

-- 4. Recriar a política RLS de inserção de usuários para usar 'profissional'
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
CREATE POLICY "Administradores podem inserir usuários"
  ON usuario FOR INSERT
  WITH CHECK (
    is_super_admin() 
    OR 
    (perfil = 'profissional' AND salao_id = get_my_salao_id())
    OR
    (perfil = 'administrador' AND salao_id = get_my_salao_id())
  );
