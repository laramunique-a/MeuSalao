# ⚡ SOLUÇÃO COMPLETA - Erros do Supabase

## 🎯 Problema que Você Está Enfrentando

Ao tentar fazer login, você vê:
```
Internal Server Error (500)
infinite recursion detected in policy for relation "usuario"
```

## ✅ SOLUÇÃO EM 3 PASSOS (5 minutos)

### ✨ Passo 1: Executar o Script de Correção no Supabase

1. **Abra o Supabase**: https://supabase.com
2. **Entre no seu projeto**
3. **Clique em SQL Editor** (ícone `</>` no menu lateral)
4. **Clique em "New query"**
5. **Abra o arquivo local**: `supabase/fix_rls_recursion.sql`
6. **Copie TUDO do arquivo**
7. **Cole no SQL Editor**
8. **Clique em "Run"** (ou Ctrl+Enter)

✅ Você deve ver: **"Success. No rows returned"**

### 🔍 Passo 2: Verificar se Funcionou

Ainda no SQL Editor, execute:

```sql
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuario'
ORDER BY policyname;
```

Você deve ver 4 políticas:
- ✅ usuario_delete_policy
- ✅ usuario_insert_policy
- ✅ usuario_select_policy
- ✅ usuario_update_policy

### 🚀 Passo 3: Testar o Sistema

1. **Volte ao navegador**: http://localhost:5173
2. **Recarregue a página** (F5 ou Ctrl+R)
3. **Faça login** com o email/senha que você criou
4. **SUCESSO!** Você deve entrar no Dashboard ✨

## 📋 Checklist Completo

- [ ] ✅ Credenciais do Supabase configuradas no .env.local
- [ ] ✅ Chave anon/public correta (começa com "eyJ")
- [ ] ✅ Executei o script fix_rls_recursion.sql
- [ ] ✅ Vi "Success" no SQL Editor
- [ ] ✅ Verifiquei que as 4 políticas foram criadas
- [ ] ✅ Recarreguei a página de login (F5)
- [ ] ✅ Fiz login com sucesso!

## 🔧 Validação Rápida

Execute este comando no terminal do projeto:
```bash
.\validar-supabase.ps1
```

Você deve ver:
```
========================================
       VALIDACAO BEM-SUCEDIDA!
========================================
```

Pressione qualquer tecla para continuar.

## ❓ Troubleshooting

### Erro persiste após executar o script?

**Solução 1: Limpar políticas antigas**
```sql
-- Execute no SQL Editor do Supabase
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo salão" ON usuario;
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem atualizar usuários" ON usuario;
DROP POLICY IF EXISTS "Administradores podem deletar usuários" ON usuario;
```

Depois execute o `fix_rls_recursion.sql` novamente.

**Solução 2: Limpar cache do navegador**
1. Pressione Ctrl+Shift+R (reload forçado)
2. Ou F12 → Application → Clear storage → Clear site data

**Solução 3: Verificar console do navegador**
1. Abra DevTools (F12)
2. Vá para Console
3. Veja se há outros erros

### Script fecha muito rápido ao executar validar-supabase.ps1?

Isso é normal! O script foi atualizado e agora pausa ao final.
Você deve ver a mensagem "Pressione qualquer tecla para continuar..."

### Ainda dá erro "No API key found"?

Verifique se a chave no `.env.local` está correta:
```bash
Get-Content .env.local
```

A chave deve:
- ✅ Começar com `eyJ`
- ✅ Ter mais de 200 caracteres
- ❌ NÃO começar com `sb_secret_`

### Erro "invalid_grant" ou "Invalid login credentials"?

1. Confirme que o usuário foi criado no Supabase Authentication
2. Verifique se o email está confirmado (Auto Confirm User = ON)
3. Certifique-se de que criou o registro na tabela `usuario`:

```sql
-- Verificar se o usuário existe
SELECT * FROM usuario WHERE email = 'seu@email.com';
```

Se não existir, execute:
```sql
INSERT INTO usuario (salao_id, auth_user_id, nome, email, perfil, ativo)
VALUES (
  'SEU-SALAO-ID',
  'SEU-USER-UID',
  'Seu Nome',
  'seu@email.com',
  'administrador',
  true
);
```

## 📚 Arquivos de Referência

| Arquivo | Quando Usar |
|---------|-------------|
| `fix_rls_recursion.sql` | ✅ **USE ESTE** para corrigir o erro de recursão |
| `002_create_rls_policies_v2.sql` | Use em projetos novos (sem recursão) |
| `validar-supabase.ps1` | Validar credenciais do .env.local |
| `CORRIGIR_ERRO_API_KEY.md` | Se der erro "No API key found" |

## 🎉 Próximos Passos Após o Login

Após fazer login com sucesso, você terá acesso a:

1. **Dashboard** - Visão geral do salão
2. **Agenda** - Gerenciar agendamentos
3. **Clientes** - Cadastro de clientes
4. **Serviços** - Cadastro de serviços
5. **Caixa** - Controle financeiro
6. **Relatórios** (admin) - Análises gerenciais
7. **Configurações** (admin) - Dados do salão

## 📞 Ainda Precisa de Ajuda?

1. Veja o console do navegador (F12) para erros detalhados
2. Verifique os logs do Supabase (Logs no menu lateral)
3. Confirme que todas as tabelas foram criadas (Table Editor)

---

**Execute o fix_rls_recursion.sql e pronto! Sistema funcionando! 🚀**
