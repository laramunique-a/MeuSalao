# PASSO A PASSO: Como Corrigir o Erro "No API key found"

## 🔴 Problema Identificado

Você está usando a chave ERRADA no arquivo `.env.local`:
```
VITE_SUPABASE_ANON_KEY=sb_secret_Kp0_q-wjh2CAERlipAmwUQ_u5jevWVi
```

Esta chave começa com `sb_secret_` e NÃO deve ser usada no frontend!

## ✅ Solução: 3 Passos Simples

### Passo 1: Abrir o Supabase

1. Vá para: https://supabase.com
2. Faça login
3. Clique no seu projeto

### Passo 2: Encontrar a Chave Correta

1. No menu lateral esquerdo, clique em **⚙️ Settings** (último ícone)
2. Clique em **API**
3. Role até a seção **"Project API keys"**
4. Você verá algo assim:

```
┌─────────────────────────────────────────────────┐
│ Project API keys                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ anon                                            │
│ public                                          │
│ 👁️ Reveal  📋 Copy                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3... │ ← COPIE ESTA!
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ service_role                                    │
│ secret                                          │
│ 👁️ Reveal  📋 Copy                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3... │ ← NÃO USE ESTA!
│                                                 │
└─────────────────────────────────────────────────┘
```

5. **Clique no ícone 📋 "Copy"** da linha **"anon / public"** (a primeira)

### Passo 3: Atualizar o .env.local

1. Abra o arquivo `.env.local` no seu editor de código
2. Substitua a linha da `VITE_SUPABASE_ANON_KEY` pela chave que você copiou
3. O arquivo deve ficar assim:

```env
VITE_SUPABASE_URL=https://vqrooeeddfkfoubntcmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcm9vZWVkZGZrZm91Ym50Y21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDkyMDMsImV4cCI6MjA1NDYyNTIwM30.SUA_CHAVE_COMPLETA_AQUI_SERA_MUITO_LONGA
```

⚠️ **ATENÇÃO**: A chave correta tem mais de 200 caracteres!

4. Salve o arquivo (Ctrl+S)

### Passo 4: Reiniciar o Servidor

1. No terminal onde está rodando o servidor, pressione **Ctrl+C** para parar
2. Execute novamente:
   ```bash
   npm run dev
   ```

### Passo 5: Validar a Configuração

Execute o script de validação:
```bash
.\validar-supabase.ps1
```

Se tudo estiver correto, você verá:
```
========================================
       VALIDACAO BEM-SUCEDIDA!
========================================
```

### Passo 6: Testar o Login

1. Acesse: http://localhost:5173
2. Faça login com o email e senha que você criou no Supabase

## 📋 Checklist

- [ ] Acessei Settings > API no Supabase
- [ ] Copiei a chave marcada como "anon / public"
- [ ] A chave começa com "eyJ"
- [ ] A chave tem mais de 200 caracteres
- [ ] Atualizei o arquivo .env.local
- [ ] Salvei o arquivo
- [ ] Reiniciei o servidor (npm run dev)
- [ ] Executei o validar-supabase.ps1
- [ ] Login funcionou!

## ❓ Ainda com Problemas?

### A chave é muito curta?
- Você copiou apenas parte dela
- Clique no ícone 📋 "Copy" ao invés de selecionar manualmente

### Não encontro a chave "anon"?
- Procure por "Project API keys" na página de API
- A primeira chave é a "anon / public"

### Continua dando erro?
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Abra o DevTools (F12) e veja o console
3. Verifique se o .env.local está na RAIZ do projeto
4. Confirme que salvou o arquivo

---

**Após estes passos, o erro será resolvido! 🎉**
