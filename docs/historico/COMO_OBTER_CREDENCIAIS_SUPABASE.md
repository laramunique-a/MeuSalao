# Como Obter as Credenciais Corretas do Supabase

## Passo 1: Acessar o Projeto no Supabase

1. Acesse: https://supabase.com
2. Faça login
3. Clique no projeto **MeuSalao** (ou o nome que você deu)

## Passo 2: Ir para Configurações de API

1. No menu lateral esquerdo, clique em **⚙️ Settings** (último ícone)
2. No submenu, clique em **API**

## Passo 3: Copiar as Credenciais CORRETAS

Você verá uma tela com várias seções. Procure por:

### 📍 Seção: "Project API keys"

Você verá duas chaves:

#### 1. Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
✅ Essa está correta no seu .env.local!

#### 2. anon / public (API key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcm9vZWVkZGZrZm91Ym50Y21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDkyMDMsImV4cCI6MjA1NDYyNTIwM30...
```
❌ **ESSA É A QUE VOCÊ PRECISA!**

⚠️ **IMPORTANTE**: 
- A chave **anon/public** é LONGA (mais de 200 caracteres)
- Ela SEMPRE começa com `eyJ`
- NÃO use a chave `service_role` (que é secreta e perigosa)

## Passo 4: Atualizar o .env.local

Abra o arquivo `.env.local` no seu editor e substitua:

```env
VITE_SUPABASE_URL=https://vqrooeeddfkfoubntcmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcm9vZWVkZGZrZm91Ym50Y21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDkyMDMsImV4cCI6MjA1NDYyNTIwM30.SUA_CHAVE_COMPLETA_AQUI
```

## Passo 5: Reiniciar o Servidor

Depois de atualizar o `.env.local`:

1. Pare o servidor (Ctrl+C no terminal)
2. Execute novamente: `npm run dev`
3. Acesse: http://localhost:5173

## 🔍 Como Identificar a Chave Correta

| Chave | Começa com | Uso | Deve usar? |
|-------|-----------|-----|------------|
| **anon / public** | `eyJ...` | Frontend/Cliente | ✅ SIM |
| **service_role** | `eyJ...` (mas diferente) | Backend/Admin | ❌ NÃO |
| Outra | `sb_secret_...` | Não é uma chave válida | ❌ NÃO |

## 📸 Screenshot de Referência

Na página de Settings → API, você verá algo assim:

```
Configuration

Project URL
https://vqrooeeddfkfoubntcmq.supabase.co

Project API keys

anon
public
👁️ Reveal
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...

service_role
secret
👁️ Reveal
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

✅ **Copie a que está marcada como "anon / public"**

## ❓ Troubleshooting

### Ainda dá erro "No API key found"?
1. Verifique se o arquivo `.env.local` está na **raiz do projeto**
2. Confirme que as variáveis começam com `VITE_`
3. Reinicie completamente o servidor (parar e iniciar de novo)
4. Limpe o cache do navegador (Ctrl+Shift+R)

### A chave está muito curta?
- A chave `anon/public` tem 200+ caracteres
- Se está curta, você copiou errado

### Não vejo a chave completa?
- Clique no ícone 👁️ "Reveal" para mostrar
- Ou clique no ícone 📋 "Copy" para copiar direto

---

**Após corrigir, o erro desaparecerá e você conseguirá fazer login! 🎉**
