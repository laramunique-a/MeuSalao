# Guia de Configuração do Supabase - MeuSalão

## Passo 1: Criar Conta e Projeto no Supabase

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login (com GitHub, Google ou email)
4. Clique em "New Project"
5. Preencha:
   - **Name**: MeuSalao (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (ANOTE ESTA SENHA!)
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
   - **Pricing Plan**: Free (para desenvolvimento)
6. Clique em "Create new project"
7. Aguarde 2-3 minutos enquanto o projeto é criado

## Passo 2: Obter Credenciais do Projeto

1. Após o projeto ser criado, vá para **⚙️ Settings** (ícone de engrenagem no menu lateral)
2. Clique em **API** no submenu
3. Na seção "Configuration", você verá:

### ✅ Credenciais que você PRECISA copiar:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
Copie toda a URL que aparece.

**anon / public (API key):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```
⚠️ **IMPORTANTE**: 
- Clique no ícone 👁️ "Reveal" ou 📋 "Copy" 
- Esta chave é LONGA (mais de 200 caracteres)
- SEMPRE começa com `eyJ`
- É a chave marcada como **"anon"** ou **"public"**

### ❌ NÃO use estas chaves:

- **service_role**: Chave secreta (NÃO use no frontend!)
- Qualquer chave que comece com `sb_secret_`

## Passo 3: Configurar Variáveis de Ambiente Localmente

1. No seu projeto, crie o arquivo `.env.local` (já existe .env.example como modelo)
2. Adicione as credenciais:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-completa-aqui
```

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` no Git!

## Passo 4: Executar Migrations SQL

### Opção A: Via Interface Web (Recomendado para iniciantes)

1. No Supabase, vá para **SQL Editor** (ícone de </> no menu lateral)
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `supabase/migrations/001_create_tables.sql`
4. Cole no editor SQL
5. Clique em "Run" (ou pressione Ctrl+Enter)
6. Aguarde a execução (deve aparecer "Success. No rows returned")
7. Repita os passos 2-6 para o arquivo `supabase/migrations/002_create_rls_policies.sql`

### Opção B: Via CLI do Supabase (Avançado)

```bash
# Instalar CLI do Supabase globalmente
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto local com projeto remoto
supabase link --project-ref xxxxxxxxxxxxx

# Aplicar migrations
supabase db push
```

## Passo 5: Verificar Tabelas Criadas

1. No Supabase, vá para **Table Editor** (ícone de tabela no menu lateral)
2. Você deve ver as seguintes tabelas:
   - ✅ salao
   - ✅ usuario
   - ✅ cliente
   - ✅ servico
   - ✅ agendamento
   - ✅ transacao_caixa

## Passo 6: Configurar Storage para Logos

1. No Supabase, vá para **Storage** (ícone de pasta no menu lateral)
2. Clique em "Create a new bucket"
3. Preencha:
   - **Name**: `salao-logos`
   - **Public bucket**: ✅ Marque esta opção
4. Clique em "Create bucket"

### Configurar Políticas do Bucket

1. Clique no bucket `salao-logos` que você acabou de criar
2. Vá para a aba **Policies**
3. Clique em "New policy"
4. Crie **3 políticas separadas** conforme abaixo:

#### Política 1: SELECT (Permitir leitura pública)

1. No formulário "Adding new policy to salao-logos":
   - **Policy name**: `Allow public read`
   - **Allowed operation**: Marque apenas ☑️ **SELECT**
   - **Target roles**: Deixe `Defaults to all (public) roles if none selected`
   - **Policy definition**: Digite `true`
2. Clique em "Review" e depois "Save policy"

#### Política 2: INSERT (Permitir upload autenticado)

1. Clique novamente em "New policy"
2. No formulário:
   - **Policy name**: `Allow authenticated upload`
   - **Allowed operation**: Marque apenas ☑️ **INSERT**
   - **Target roles**: Deixe `Defaults to all (public) roles if none selected`
   - **Policy definition**: Digite `(auth.uid() IS NOT NULL)`
3. Clique em "Review" e depois "Save policy"

#### Política 3: UPDATE (Permitir atualização autenticada)

1. Clique novamente em "New policy"
2. No formulário:
   - **Policy name**: `Allow authenticated update`
   - **Allowed operation**: Marque apenas ☑️ **UPDATE**
   - **Target roles**: Deixe `Defaults to all (public) roles if none selected`
   - **Policy definition**: Digite `(auth.uid() IS NOT NULL)`
3. Clique em "Review" e depois "Save policy"

#### Política 4 (Opcional): DELETE (Permitir exclusão autenticada)

1. Clique novamente em "New policy"
2. No formulário:
   - **Policy name**: `Allow authenticated delete`
   - **Allowed operation**: Marque apenas ☑️ **DELETE**
   - **Target roles**: Deixe `Defaults to all (public) roles if none selected`
   - **Policy definition**: Digite `(auth.uid() IS NOT NULL)`
3. Clique em "Review" e depois "Save policy"

**✅ Após criar as políticas, você deve ver 3 ou 4 políticas listadas na aba Policies do bucket.**

## Passo 7: Criar Primeiro Usuário Administrador

Como o sistema usa autenticação do Supabase, você precisa criar o primeiro usuário:

### 7.1. Criar Usuário de Autenticação

1. No Supabase, vá para **Authentication** → **Users**
2. Clique em "Add user" → "Create new user"
3. Preencha:
   - **Email**: seu@email.com
   - **Password**: senha forte
   - **Auto Confirm User**: ✅ Marque esta opção
4. Clique em "Create user"
5. **ANOTE o User UID** (algo como: `a1b2c3d4-...`)

### 7.2. Criar Salão

1. Vá para **SQL Editor**
2. Execute o seguinte SQL (substitua os dados):

```sql
-- Criar salão
INSERT INTO salao (nome, endereco, telefone)
VALUES 
  ('Meu Salão de Beleza', 'Rua Exemplo, 123', '(11) 98765-4321');
```

3. Clique em "Run"
4. Anote o ID do salão criado (aparecerá na resposta, algo como: `550e8400-...`)

### 7.3. Vincular Usuário ao Salão

1. No SQL Editor, execute (substitua os IDs):

```sql
-- Vincular usuário como administrador
INSERT INTO usuario (salao_id, auth_user_id, nome, email, perfil, ativo)
VALUES 
  (
    'SEU-SALAO-ID-AQUI',           -- ID do salão (passo 7.2)
    'SEU-USER-UID-AQUI',            -- User UID (passo 7.1)
    'Seu Nome Completo',            -- Seu nome
    'seu@email.com',                -- Mesmo email do passo 7.1
    'administrador',                -- Perfil de admin
    true                            -- Ativo
  );
```

## Passo 8: Testar o Sistema

1. No terminal do projeto, execute:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173

3. Faça login com o email e senha criados no passo 7.1

4. Se tudo estiver correto, você será redirecionado para o Dashboard!

## Troubleshooting (Resolução de Problemas)

### Erro: "Variáveis de ambiente do Supabase não configuradas"
- Verifique se o arquivo `.env.local` existe
- Confirme se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "Invalid login credentials"
- Confirme que o email e senha estão corretos
- Verifique se o usuário foi confirmado no Supabase (passo 7.1)
- Certifique-se de que o registro na tabela `usuario` foi criado (passo 7.3)

### Erro: "Row Level Security policy violation"
- Confirme que as migrations de RLS foram executadas (002_create_rls_policies.sql)
- Verifique se o `auth_user_id` na tabela `usuario` corresponde ao User UID do Supabase

### Tabelas não aparecem
- Verifique se as migrations foram executadas sem erros
- Confirme se você está no projeto correto no Supabase
- Tente executar as migrations novamente

### Não consigo fazer upload de logo
- Verifique se o bucket `salao-logos` foi criado
- Confirme que as políticas de storage foram configuradas
- Certifique-se de que o bucket está marcado como público

## Próximos Passos

Após a configuração inicial, você pode:

1. ✅ Adicionar mais usuários (funcionários)
2. ✅ Cadastrar clientes
3. ✅ Cadastrar serviços
4. ✅ Fazer agendamentos
5. ✅ Registrar transações de caixa

## Dados de Exemplo (Opcional)

Se quiser popular o banco com dados de exemplo, execute no SQL Editor:

```sql
-- Serviços de exemplo
INSERT INTO servico (salao_id, nome, descricao, valor, duracao_minutos)
VALUES 
  ('SEU-SALAO-ID', 'Corte de Cabelo Feminino', 'Corte e finalização', 80.00, 60),
  ('SEU-SALAO-ID', 'Corte de Cabelo Masculino', 'Corte e finalização', 50.00, 30),
  ('SEU-SALAO-ID', 'Manicure', 'Esmaltação simples', 35.00, 45),
  ('SEU-SALAO-ID', 'Pedicure', 'Esmaltação simples', 40.00, 45),
  ('SEU-SALAO-ID', 'Escova', 'Escova modeladora', 60.00, 45),
  ('SEU-SALAO-ID', 'Hidratação', 'Tratamento capilar', 100.00, 60);

-- Clientes de exemplo
INSERT INTO cliente (salao_id, nome, telefone, email)
VALUES 
  ('SEU-SALAO-ID', 'Maria Silva', '(11) 91234-5678', 'maria@email.com'),
  ('SEU-SALAO-ID', 'João Santos', '(11) 98765-4321', 'joao@email.com'),
  ('SEU-SALAO-ID', 'Ana Costa', '(11) 99876-5432', 'ana@email.com');
```

## Suporte

- Documentação Supabase: https://supabase.com/docs
- Discord Supabase: https://discord.supabase.com
- GitHub do Projeto: (adicione aqui o link do seu repositório)

---

**Configuração concluída! 🎉**
