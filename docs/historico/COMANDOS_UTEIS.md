# Comandos Úteis - MeuSalão

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Verificar configuração do projeto
.\check-setup.ps1
```

## Supabase

### Conectar ao projeto
```bash
# Via interface web
https://supabase.com → Seu Projeto → SQL Editor

# Via CLI (opcional)
npm install -g supabase
supabase login
supabase link --project-ref seu-projeto-ref
```

### Executar migrations
```sql
-- No SQL Editor do Supabase, execute na ordem:
-- 1. supabase/migrations/001_create_tables.sql
-- 2. supabase/migrations/002_create_rls_policies.sql
```

### Gerar tipos TypeScript (opcional)
```bash
npx supabase gen types typescript --project-id seu-projeto-ref > src/types/database.types.ts
```

## Git

```bash
# Inicializar repositório
git init
git add .
git commit -m "Initial commit: MeuSalão project setup"

# Conectar ao GitHub
git remote add origin https://github.com/seu-usuario/meusalao.git
git branch -M main
git push -u origin main
```

## Troubleshooting

### Limpar cache e reinstalar
```bash
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .vite
npm install
```

### Resetar configuração
```bash
Remove-Item .env.local
Copy-Item .env.example .env.local
# Edite .env.local com suas credenciais
```

### Ver portas em uso
```bash
netstat -ano | findstr :5173
```

### Matar processo na porta 5173
```bash
# Encontrar PID
netstat -ano | findstr :5173

# Matar processo (substitua PID)
taskkill /PID numero-do-pid /F
```

## Verificações Rápidas

### Verificar se o servidor está rodando
```bash
curl http://localhost:5173
# ou abra no navegador
```

### Testar conexão com Supabase
```bash
# No console do navegador (F12):
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado')
```

## Queries SQL Úteis

### Ver todas as tabelas
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Contar registros por tabela
```sql
SELECT 
  (SELECT COUNT(*) FROM salao) as total_saloes,
  (SELECT COUNT(*) FROM usuario) as total_usuarios,
  (SELECT COUNT(*) FROM cliente) as total_clientes,
  (SELECT COUNT(*) FROM servico) as total_servicos,
  (SELECT COUNT(*) FROM agendamento) as total_agendamentos,
  (SELECT COUNT(*) FROM transacao_caixa) as total_transacoes;
```

### Ver usuários e seus salões
```sql
SELECT 
  u.nome as usuario,
  u.email,
  u.perfil,
  u.ativo,
  s.nome as salao
FROM usuario u
JOIN salao s ON u.salao_id = s.id;
```

### Ver políticas RLS ativas
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public';
```

### Limpar todos os dados (CUIDADO!)
```sql
-- Use apenas em ambiente de desenvolvimento
DELETE FROM transacao_caixa;
DELETE FROM agendamento;
DELETE FROM servico;
DELETE FROM cliente;
DELETE FROM usuario;
DELETE FROM salao;
```

## Atualizar Dependências

```bash
# Ver dependências desatualizadas
npm outdated

# Atualizar tudo (pode quebrar)
npm update

# Atualizar versão específica
npm install react@latest
npm install @supabase/supabase-js@latest
```

## Gerenciar Storage do Supabase

### Via código (exemplo)
```typescript
import { supabase } from '@/lib/supabase'

// Upload de arquivo
const { data, error } = await supabase.storage
  .from('salao-logos')
  .upload('logo.png', file)

// Download de arquivo
const { data } = supabase.storage
  .from('salao-logos')
  .getPublicUrl('logo.png')

// Deletar arquivo
await supabase.storage
  .from('salao-logos')
  .remove(['logo.png'])
```

## Debugging

### Ver logs do Vite
```bash
npm run dev -- --debug
```

### Build com relatório de bundle
```bash
npm run build -- --mode development
```

### Inspecionar build
```bash
npm run preview
# Abra: http://localhost:4173
```

## Configuração do VS Code (Recomendado)

Crie `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

Extensões recomendadas (`.vscode/extensions.json`):
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "supabase.supabase-vscode"
  ]
}
```

## Performance

### Analisar bundle size
```bash
npm run build
npx vite-bundle-visualizer
```

### Lighthouse CI
```bash
npm run build
npm run preview
# Abra DevTools → Lighthouse → Generate report
```

## Backup e Restore

### Backup do Supabase
```bash
# Via CLI
supabase db dump -f backup.sql

# Via web: Settings → Database → Database Backups
```

### Restore
```bash
# Via CLI
supabase db reset
supabase db push
```

---

**💡 Dica**: Salve este arquivo como referência rápida!
