-- ================================================================
-- SCRIPT COMPLETO PARA CRIAR DADOS INICIAIS DO SISTEMA
-- Execute APÓS criar as tabelas (migrations 001 e 002)
-- ================================================================

-- IMPORTANTE: Substitua os valores abaixo com os seus dados reais
-- Para obter o auth_user_id, vá em Authentication > Users no Supabase
-- e copie o User UID do usuário que você criou

-- ================================================================
-- PASSO 1: Criar o Salão
-- ================================================================
-- Execute este bloco primeiro e ANOTE o ID retornado
INSERT INTO salao (nome, endereco, telefone, configuracoes)
VALUES (
  'Meu Salão de Beleza',
  'Rua Exemplo, 123 - Centro',
  '(11) 98765-4321',
  '{
    "horario_funcionamento": {
      "segunda": {"inicio": "09:00", "fim": "18:00"},
      "terca": {"inicio": "09:00", "fim": "18:00"},
      "quarta": {"inicio": "09:00", "fim": "18:00"},
      "quinta": {"inicio": "09:00", "fim": "18:00"},
      "sexta": {"inicio": "09:00", "fim": "18:00"},
      "sabado": {"inicio": "09:00", "fim": "15:00"},
      "domingo": null
    }
  }'::jsonb
)
RETURNING id;

-- Após executar o comando acima, COPIE o ID retornado e use nos próximos passos

-- ================================================================
-- PASSO 2: Vincular Usuário Administrador
-- ================================================================
-- SUBSTITUA:
-- - 'COLE-O-ID-DO-SALAO-AQUI' pelo ID retornado no Passo 1
-- - 'COLE-O-USER-UID-AQUI' pelo User UID do Supabase (Authentication > Users)
-- - Os demais dados conforme necessário

INSERT INTO usuario (salao_id, auth_user_id, nome, email, perfil, ativo)
VALUES (
  'COLE-O-ID-DO-SALAO-AQUI',          -- ID do salão (Passo 1)
  'COLE-O-USER-UID-AQUI',              -- User UID do Supabase Authentication
  'Administrador do Sistema',          -- Nome do administrador
  'admin@meusalao.com',                -- Email (mesmo usado no Supabase Auth)
  'administrador',                     -- Perfil de administrador
  true                                 -- Usuário ativo
);

-- ================================================================
-- PASSO 3 (OPCIONAL): Adicionar Serviços Padrão
-- ================================================================
-- SUBSTITUA 'COLE-O-ID-DO-SALAO-AQUI' pelo ID do salão

INSERT INTO servico (salao_id, nome, descricao, valor, duracao_minutos, ativo)
VALUES 
  -- Cabelo
  ('COLE-O-ID-DO-SALAO-AQUI', 'Corte Feminino', 'Corte de cabelo feminino com finalização', 80.00, 60, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Corte Masculino', 'Corte de cabelo masculino', 50.00, 30, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Corte Infantil', 'Corte de cabelo infantil', 40.00, 30, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Escova', 'Escova modeladora', 60.00, 45, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Hidratação', 'Tratamento capilar hidratante', 100.00, 60, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Coloração', 'Coloração completa', 150.00, 120, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Mechas', 'Mechas ou luzes', 200.00, 150, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Progressiva', 'Escova progressiva', 300.00, 180, true),
  
  -- Unhas
  ('COLE-O-ID-DO-SALAO-AQUI', 'Manicure', 'Esmaltação de mãos simples', 35.00, 45, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Pedicure', 'Esmaltação de pés simples', 40.00, 45, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Manicure + Pedicure', 'Combo mãos e pés', 70.00, 90, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Unhas em Gel', 'Alongamento ou manutenção em gel', 100.00, 90, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Nail Art', 'Decoração de unhas', 15.00, 15, true),
  
  -- Estética
  ('COLE-O-ID-DO-SALAO-AQUI', 'Design de Sobrancelha', 'Design com linha ou pinça', 30.00, 30, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Depilação Facial', 'Depilação com cera ou linha', 25.00, 20, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Limpeza de Pele', 'Limpeza facial profunda', 120.00, 90, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Massagem Relaxante', 'Massagem corporal', 100.00, 60, true),
  
  -- Maquiagem
  ('COLE-O-ID-DO-SALAO-AQUI', 'Maquiagem Social', 'Maquiagem para eventos', 150.00, 60, true),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Maquiagem de Noiva', 'Maquiagem para casamento', 300.00, 90, true);

-- ================================================================
-- PASSO 4 (OPCIONAL): Adicionar Clientes de Exemplo
-- ================================================================
-- SUBSTITUA 'COLE-O-ID-DO-SALAO-AQUI' pelo ID do salão

INSERT INTO cliente (salao_id, nome, telefone, email, observacoes)
VALUES 
  ('COLE-O-ID-DO-SALAO-AQUI', 'Maria Silva Santos', '(11) 91234-5678', 'maria.silva@email.com', 'Cliente regular, prefere horários da tarde'),
  ('COLE-O-ID-DO-SALAO-AQUI', 'João Pedro Oliveira', '(11) 98765-4321', 'joao.oliveira@email.com', NULL),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Ana Carolina Costa', '(11) 99876-5432', 'ana.costa@email.com', 'Alérgica a determinados produtos'),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Carlos Eduardo Lima', '(11) 97654-3210', 'carlos.lima@email.com', NULL),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Fernanda Alves', '(11) 96543-2109', 'fernanda.alves@email.com', 'Prefere a profissional Maria'),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Ricardo Santos', '(11) 95432-1098', NULL, 'Cliente sem email'),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Juliana Ferreira', '(11) 94321-0987', 'juliana.f@email.com', NULL),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Paulo Henrique', '(11) 93210-9876', 'paulo.h@email.com', 'Cliente VIP'),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Beatriz Souza', '(11) 92109-8765', 'beatriz.souza@email.com', NULL),
  ('COLE-O-ID-DO-SALAO-AQUI', 'Roberto Martins', '(11) 91098-7654', NULL, 'Preferência por atendimento rápido');

-- ================================================================
-- PASSO 5 (OPCIONAL): Adicionar Funcionário de Exemplo
-- ================================================================
-- IMPORTANTE: Antes de executar, você precisa:
-- 1. Criar um novo usuário no Supabase Authentication
-- 2. Copiar o User UID dele
-- 3. Substituir nos valores abaixo

INSERT INTO usuario (salao_id, auth_user_id, nome, email, perfil, ativo)
VALUES (
  'COLE-O-ID-DO-SALAO-AQUI',              -- ID do salão
  'COLE-O-USER-UID-DO-FUNCIONARIO-AQUI',  -- User UID do funcionário (criar em Authentication)
  'Maria Aparecida Silva',                 -- Nome do funcionário
  'maria.funcionaria@meusalao.com',        -- Email (mesmo do Supabase Auth)
  'funcionario',                           -- Perfil de funcionário
  true                                     -- Usuário ativo
);

-- ================================================================
-- VERIFICAÇÕES - Execute para confirmar que tudo foi criado
-- ================================================================

-- Verificar salão criado
SELECT id, nome, telefone FROM salao;

-- Verificar usuários criados
SELECT id, nome, email, perfil, ativo FROM usuario;

-- Verificar quantidade de serviços
SELECT COUNT(*) as total_servicos FROM servico;

-- Verificar quantidade de clientes
SELECT COUNT(*) as total_clientes FROM cliente;

-- Verificar se o vínculo usuário-salão está correto
SELECT 
  u.nome as usuario_nome,
  u.email as usuario_email,
  u.perfil,
  s.nome as salao_nome
FROM usuario u
JOIN salao s ON u.salao_id = s.id;

-- ================================================================
-- TROUBLESHOOTING
-- ================================================================

-- Se precisar deletar tudo e recomeçar (CUIDADO! Remove todos os dados):
-- DELETE FROM transacao_caixa;
-- DELETE FROM agendamento;
-- DELETE FROM servico;
-- DELETE FROM cliente;
-- DELETE FROM usuario;
-- DELETE FROM salao;

-- Se precisar encontrar o ID do salão:
-- SELECT id, nome FROM salao;

-- Se precisar encontrar o auth_user_id correto:
-- Vá no Supabase: Authentication > Users e copie o User UID

-- ================================================================
-- NOTAS IMPORTANTES
-- ================================================================
-- 1. Execute os blocos na ORDEM apresentada
-- 2. Sempre SUBSTITUA os placeholders (COLE-O-ID-...)
-- 3. Não execute DELETE sem backup em produção
-- 4. Mantenha uma cópia deste script com seus IDs reais preenchidos
-- 5. O auth_user_id DEVE corresponder ao User UID do Supabase Authentication
