# CORREÇÃO URGENTE: Erro "infinite recursion detected in policy"

## 🔴 Problema

Ao tentar fazer login, você vê o erro:
```
Internal Server Error (500)
infinite recursion detected in policy for relation "usuario"
```

Este erro ocorre porque as políticas RLS (Row Level Security) do Supabase estão fazendo referência circular à própria tabela `usuario`.

## ✅ Solução Rápida (2 minutos)

### Passo 1: Abrir o Supabase SQL Editor

1. Acesse: https://supabase.com
2. Clique no seu projeto
3. No menu lateral, clique em **SQL Editor** (ícone `</>`)
4. Clique em "New query"

### Passo 2: Executar o Script de Correção

1. Abra o arquivo: `supabase/fix_rls_recursion.sql`
2. **Copie TODO o conteúdo do arquivo**
3. **Cole no SQL Editor do Supabase**
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

Você verá a mensagem: "Success. No rows returned" ✅

### Passo 3: Verificar a Correção

Ainda no SQL Editor, execute esta query para verificar:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuario';
```

Você deve ver 4 políticas:
- ✅ usuario_select_policy
- ✅ usuario_insert_policy
- ✅ usuario_update_policy
- ✅ usuario_delete_policy

### Passo 4: Testar o Login

1. Volte ao navegador: http://localhost:5173
2. **Recarregue a página** (F5 ou Ctrl+R)
3. Faça login novamente

**Agora deve funcionar!** 🎉

## 🔍 O Que Foi Corrigido?

### Problema Anterior
As políticas antigas faziam isso:
```sql
-- ❌ ERRADO: Referência circular
SELECT salao_id FROM usuario WHERE auth_user_id = auth.uid()
```

Quando você consultava a tabela `usuario`, a política executava outra consulta na tabela `usuario`, que por sua vez executava a política de novo... **recursão infinita!**

### Solução Aplicada
As novas políticas usam:
```sql
-- ✅ CORRETO: Subquery isolada com LIMIT 1
SELECT u.salao_id FROM usuario u WHERE u.auth_user_id = auth.uid() LIMIT 1
```

Isso evita a recursão ao usar um alias `u` e limitar o resultado.

## 📋 Checklist de Verificação

- [ ] Abri o SQL Editor no Supabase
- [ ] Copiei e executei `supabase/fix_rls_recursion.sql`
- [ ] Vi a mensagem "Success"
- [ ] Verifiquei que as 4 políticas foram criadas
- [ ] Recarreguei a página de login (F5)
- [ ] Fiz login com sucesso
- [ ] Não vejo mais o erro 500

## 🆘 Ainda com Problemas?

### Erro persiste após executar o script?
1. Verifique se você executou TODO o conteúdo do arquivo
2. Confirme que não houve erros no SQL Editor
3. Tente fazer logout do Supabase e login novamente

### Erro "permission denied"?
- Certifique-se de que está logado como owner do projeto no Supabase

### Outro erro aparece?
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Copie o erro completo
4. Me informe o erro exato

## 📚 Arquivos Relacionados

- `supabase/fix_rls_recursion.sql` - Script de correção (USE ESTE!)
- `supabase/migrations/002_create_rls_policies.sql` - Versão original (NÃO use mais)

---

**Execute o script fix_rls_recursion.sql e o problema será resolvido!** ✨
