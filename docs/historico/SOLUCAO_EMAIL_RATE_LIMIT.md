# 🔧 Solução: Erro "Email Rate Limit Exceeded"

## 🚨 Problema

Ao tentar cadastrar novos usuários, aparece o erro:
```
Erro ao cadastrar usuário
email rate limit exceeded
```

### Causa
O Supabase no plano gratuito limita o número de emails de confirmação que podem ser enviados por hora. Isso é uma proteção contra spam e abuso.

## ✅ Solução Rápida (Desenvolvimento)

### Opção 1: Desabilitar Confirmação de Email (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** (menu lateral esquerdo)
3. Clique em **Settings**
4. Encontre a seção **"Email Auth"**
5. **DESABILITE** a opção **"Enable email confirmations"**
6. Clique em **"Save"**

✅ **Pronto!** Agora você pode criar usuários sem precisar de confirmação por email.

### Opção 2: Confirmar Usuários Manualmente via SQL

Se você já criou usuários mas eles não foram confirmados:

1. Vá em **SQL Editor** no Supabase
2. Execute o seguinte SQL (substitua o email):

```sql
-- Confirmar um usuário específico
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'dasvirg@gmail.com';
```

Ou para confirmar todos os usuários pendentes:

```sql
-- Confirmar TODOS os usuários (use com cuidado!)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

### Opção 3: Criar Usuário Diretamente pelo Painel

1. No Supabase, vá em **Authentication > Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha email e senha
4. **MARQUE** a opção **"Auto Confirm User"** ✅
5. Clique em **"Create user"**
6. Anote o **User UID**
7. Vá em **SQL Editor** e execute:

```sql
INSERT INTO usuario (salao_id, auth_user_id, nome, email, perfil, ativo)
VALUES 
  (
    'SEU-SALAO-ID-AQUI',      -- ID do salão
    'USER-UID-AQUI',           -- User UID do passo 6
    'Nome do Funcionário',     -- Nome
    'email@exemplo.com',       -- Email
    'funcionario',             -- Perfil
    true                       -- Ativo
  );
```

## 🔍 Verificar Usuários Criados

Execute no SQL Editor:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  usr.nome,
  usr.perfil,
  usr.ativo
FROM auth.users u
LEFT JOIN public.usuario usr ON usr.auth_user_id = u.id
ORDER BY u.created_at DESC;
```

## 🚀 Para Produção

Se você estiver em produção e precisar criar muitos usuários:

### Opção A: Upgrade do Plano
- Considere fazer upgrade para um plano pago no Supabase
- Planos pagos têm limites de email muito maiores

### Opção B: Sistema de Convites
- Implemente um sistema de convites assíncronos
- Envie emails espaçados ao longo do tempo
- Use uma fila de processamento (ex: Bull, BullMQ)

### Opção C: Criação Manual
- Para poucos usuários, crie manualmente pelo painel do Supabase
- Use a Opção 3 descrita acima

## 📝 Código Atualizado

O código do serviço de usuário (`src/services/usuario.service.ts`) já foi atualizado para incluir opções adicionais no signUp, preparando para futuras configurações.

## ⚙️ Configuração Recomendada para Desenvolvimento

```
Authentication Settings:
- ✅ Enable email confirmations: OFF
- ✅ Enable sign ups: ON
- ✅ Minimum password length: 6
```

## 🔐 Segurança

**Importante:** Em produção, é recomendado:
- ✅ Manter confirmação de email **ATIVADA**
- ✅ Implementar rate limiting customizado
- ✅ Monitorar criação de usuários
- ✅ Usar reCAPTCHA ou similar

Para desenvolvimento local, desabilitar confirmação de email é seguro e prático.

---

**✅ Após aplicar uma das soluções acima, tente criar o usuário novamente!**
