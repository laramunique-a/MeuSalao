# 🔧 CORREÇÃO: Políticas já existem

## Execute este SQL no Supabase SQL Editor

```sql
-- ================================================================
-- PASSO 1: REMOVER TODAS as políticas da tabela usuario
-- ================================================================

DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
DROP POLICY IF EXISTS "usuario_select_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_insert_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_update_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_delete_policy" ON usuario;

-- ================================================================
-- PASSO 2: CRIAR as políticas corretas (SEM recursão)
-- ================================================================

CREATE POLICY "usuario_select_policy"
ON usuario FOR SELECT
USING (
  salao_id IN (
    SELECT u.salao_id 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "usuario_insert_policy"
ON usuario FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

CREATE POLICY "usuario_update_policy"
ON usuario FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

CREATE POLICY "usuario_delete_policy"
ON usuario FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM usuario u 
    WHERE u.auth_user_id = auth.uid() 
      AND u.perfil = 'administrador'
      AND u.salao_id = salao_id
    LIMIT 1
  )
);

-- ================================================================
-- VERIFICAÇÃO: Confirmar que funcionou
-- ================================================================

SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuario'
ORDER BY policyname;
```

## ✅ Deve retornar 4 políticas:
- usuario_delete_policy
- usuario_insert_policy
- usuario_select_policy
- usuario_update_policy

## 🚀 Após executar:
1. Volte para http://localhost:5173
2. Pressione F5 (recarregar página)
3. Faça login

**AGORA VAI FUNCIONAR!** 🎉
