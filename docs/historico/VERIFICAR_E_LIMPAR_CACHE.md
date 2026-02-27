# 🔍 VERIFICAÇÃO: As políticas foram realmente corrigidas?

Execute este SQL no Supabase SQL Editor para confirmar:

```sql
-- Ver TODAS as políticas da tabela usuario
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuario'
ORDER BY policyname;
```

## ✅ O que você DEVE ver:

Apenas 4 políticas:
1. usuario_delete_policy
2. usuario_insert_policy
3. usuario_select_policy
4. usuario_update_policy

## ❌ Se você ver isto, está ERRADO:

Se aparecer:
- "Usuários podem ver usuários do mesmo salão" ← RECURSÃO!
- "Administradores podem inserir usuários" ← RECURSÃO!

Significa que as políticas antigas AINDA ESTÃO LÁ.

## 🔧 Se as políticas antigas ainda existem:

Execute este SQL:

```sql
-- DESABILITAR RLS temporariamente
ALTER TABLE usuario DISABLE ROW LEVEL SECURITY;

-- REMOVER TODAS as políticas
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
DROP POLICY IF EXISTS "usuario_select_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_insert_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_update_policy" ON usuario;
DROP POLICY IF EXISTS "usuario_delete_policy" ON usuario;

-- REABILITAR RLS
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

-- CRIAR as políticas corretas
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

-- VERIFICAR
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'usuario'
ORDER BY policyname;
```

## 🔄 Depois de executar:

1. **Feche COMPLETAMENTE o navegador** (todas as abas)
2. **Abra novamente**
3. **Acesse**: http://localhost:5173
4. **Faça login**

## 🧹 Limpeza Adicional (se ainda não funcionar):

1. Pressione **F12** (DevTools)
2. Vá para aba **Application**
3. Menu lateral: **Storage** → **Clear site data**
4. Clique em **"Clear site data"**
5. Feche DevTools
6. Recarregue a página (**Ctrl+Shift+R**)

---

**Execute a verificação primeiro para ver se as políticas estão corretas!**
