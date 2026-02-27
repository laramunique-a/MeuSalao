# MeuSalão - Sistema de Gestão de Salão de Beleza

Sistema completo e responsivo para gestão de salão de beleza, com agendamento, controle de caixa, cadastro de clientes e serviços.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.1-purple)

## 📋 Índice

- [Stack Tecnológica](#stack-tecnológica)
- [Funcionalidades](#funcionalidades)
- [Instalação Rápida](#instalação-rápida)
- [Configuração do Supabase](#configuração-do-supabase)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)

## 🚀 Stack Tecnológica

- **Frontend**: React 18 + Vite + TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gerenciamento de Estado**: Zustand
- **Formulários**: React Hook Form + Zod
- **Rotas**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **PWA**: vite-plugin-pwa

## ✨ Funcionalidades

### Implementadas
- ✅ Sistema de autenticação (login/logout)
- ✅ Controle de acesso por perfil (admin/funcionário)
- ✅ Layout responsivo com sidebar
- ✅ Modo claro/escuro
- ✅ Dashboard com cards de resumo
- ✅ Estrutura base para todos os módulos

### Em Desenvolvimento
- 🔄 Gestão de caixa (entrada/saída, formas de pagamento, relatórios)
- 🔄 Agenda de atendimentos por profissional
- 🔄 CRUD completo de clientes com histórico
- 🔄 CRUD completo de serviços e valores
- 🔄 Módulo de relatórios gerenciais
- 🔄 Configurações do salão e gerenciamento de usuários

### Planejadas
- 📅 PWA completo (instalável)
- 📅 Notificações push
- 📅 Integração com WhatsApp
- 📅 Comissões de funcionários

## ⚡ Instalação Rápida

### Pré-requisitos

- Node.js 18+ ([Download aqui](https://nodejs.org/))
- Conta no Supabase ([Criar conta gratuita](https://supabase.com))

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Verificar Configuração

```bash
.\check-setup.ps1
```

Este script irá verificar se tudo está configurado corretamente.

### Passo 3: Configurar Variáveis de Ambiente

1. O arquivo `.env.local` já foi criado automaticamente
2. Edite o arquivo e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### Passo 4: Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🗄️ Configuração do Supabase

### Guia Completo

📖 **Leia o arquivo [SUPABASE_SETUP.md](SUPABASE_SETUP.md)** para instruções detalhadas passo a passo!

### Resumo Rápido

1. **Criar Projeto**
   - Acesse: https://supabase.com
   - Crie um novo projeto
   - Anote a URL e chave anônima

2. **Executar Migrations**
   - Vá para SQL Editor no Supabase
   - Execute: `supabase/migrations/001_create_tables.sql`
   - Execute: `supabase/migrations/002_create_rls_policies.sql`

3. **Criar Primeiro Usuário**
   - Authentication → Users → Add user
   - Use o script `supabase/seed_data.sql` para criar salão e vincular usuário

4. **Configurar Storage**
   - Storage → Create bucket: `salao-logos` (público)

## 📁 Estrutura do Projeto

```
MeuSalao/
├── public/              # Arquivos estáticos
│   ├── manifest.json    # PWA manifest
│   └── icons/           # Ícones do PWA
├── src/
│   ├── components/      # Componentes React
│   │   ├── ui/          # Componentes shadcn/ui
│   │   └── layout/      # Layout (Header, Sidebar)
│   ├── pages/           # Páginas principais
│   ├── services/        # Serviços de API
│   ├── store/           # Estado global (Zustand)
│   ├── hooks/           # Custom hooks
│   ├── types/           # Tipos TypeScript
│   ├── lib/             # Utilitários
│   └── routes/          # Configuração de rotas
├── supabase/
│   ├── migrations/      # Migrations SQL
│   └── seed_data.sql    # Dados iniciais
├── .env.local           # Variáveis de ambiente (não versionar)
├── .env.example         # Template de variáveis
├── SUPABASE_SETUP.md    # Guia de configuração do Supabase
└── check-setup.ps1      # Script de verificação
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (localhost:5173)

# Build
npm run build           # Compila para produção (pasta dist/)
npm run preview         # Preview da build de produção

# Verificação
.\check-setup.ps1       # Verifica configuração do projeto

# Linting
npm run lint            # Verifica código com ESLint
```

## 🔐 Autenticação e Permissões

### Perfis de Usuário

- **Administrador**: Acesso total ao sistema
  - Dashboard, Agenda, Clientes, Serviços, Caixa
  - Relatórios (admin only)
  - Configurações (admin only)

- **Funcionário**: Acesso operacional
  - Dashboard, Agenda, Clientes, Serviços, Caixa
  - Sem acesso a relatórios e configurações

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas baseadas em `salao_id` e `auth.uid()`
- Autenticação via Supabase Auth
- Tokens JWT automaticamente gerenciados

## 🎨 Temas

O sistema possui suporte a modo claro e escuro:

- Alternância via botão no header
- Preferência salva no localStorage
- Variáveis CSS customizadas
- Paleta de cores roxa (primary: #9333ea)

## 📱 Responsividade

- **Mobile First**: Layout otimizado para celulares
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
- Sidebar vira drawer no mobile
- Tabelas adaptadas para cards no mobile

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se `.env.local` existe e está preenchido
- Reinicie o servidor (`npm run dev`)

### Erro: "Invalid login credentials"
- Confirme que o usuário foi criado no Supabase Auth
- Verifique se o registro foi criado na tabela `usuario`
- Certifique-se de que `auth_user_id` corresponde ao User UID

### Servidor não inicia
- Verifique se a porta 5173 está livre
- Execute `npm install` novamente
- Limpe o cache: `rm -rf node_modules .vite && npm install`

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

- Documentação Supabase: https://supabase.com/docs
- Documentação React: https://react.dev
- Documentação Tailwind: https://tailwindcss.com/docs

---

**Desenvolvido com ❤️ usando React + TypeScript + Supabase**
