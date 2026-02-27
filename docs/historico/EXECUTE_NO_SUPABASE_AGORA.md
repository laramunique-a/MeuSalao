# ⚠️ IMPORTANTE: Executar Migration SQL

## 🎨 Funcionalidade de Cor Principal

A funcionalidade de alteração da cor principal do sistema foi implementada, mas requer a execução de uma migration SQL no Supabase.

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse: https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto **MeuSalão**

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **+ New query**

### 3. Executar a Migration

Copie e cole o seguinte código SQL:

```sql
-- Adicionar campo cor_primaria na tabela salao
ALTER TABLE salao 
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#9333ea';

-- Atualizar salões existentes com a cor padrão (roxo)
UPDATE salao 
SET cor_primaria = '#9333ea' 
WHERE cor_primaria IS NULL;

-- Comentário: #9333ea é a cor roxa padrão do sistema
```

### 4. Executar o Script

1. Clique no botão **Run** (ou pressione `Ctrl + Enter`)
2. Aguarde a mensagem de sucesso
3. Verifique se aparece: **"Success. 0 rows returned"** ou similar

### 5. Verificar a Coluna Criada

Execute este SQL para confirmar:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'salao' AND column_name = 'cor_primaria';
```

Deve retornar:
```
column_name   | data_type | column_default
cor_primaria  | text      | '#9333ea'::text
```

## ✅ Após Executar a Migration

1. Reinicie o servidor de desenvolvimento (se estiver rodando):
   ```powershell
   # Pressione Ctrl+C no terminal
   # Execute novamente:
   npm run dev
   ```

2. Acesse a página de **Configurações** no sistema

3. Você verá a nova seção **"Cor Principal do Sistema"** com:
   - 8 cores predefinidas (Roxo, Rosa, Azul, Verde, Laranja, Vermelho, Ciano, Índigo)
   - Campo de cor personalizada (código hexadecimal)
   - Seletor de cor visual
   - Pré-visualização em tempo real

## 🎨 Como Usar

### Selecionar Cor Predefinida
1. Clique em uma das 8 cores exibidas
2. A cor será aplicada imediatamente na pré-visualização
3. Clique em **"Salvar Alterações"**
4. A cor será aplicada em todo o sistema

### Usar Cor Personalizada
1. Digite o código hexadecimal no campo (ex: `#ff5733`)
2. Ou clique no seletor de cor visual
3. Visualize a mudança na pré-visualização
4. Clique em **"Salvar Alterações"**

### Onde a Cor é Aplicada
A cor principal personalizada será aplicada em:
- ✅ Botões primários
- ✅ Links ativos no menu lateral
- ✅ Badges e destacadores
- ✅ Ícones de ação
- ✅ Bordas de elementos selecionados
- ✅ Backgrounds de hover

## 🔄 Como Funciona Tecnicamente

1. **Armazenamento**: A cor é salva no banco de dados na tabela `salao`
2. **Hook usePrimaryColor**: Carrega a cor ao iniciar o sistema
3. **Aplicação Dinâmica**: Usa CSS Variables (--primary) para aplicar a cor
4. **Geração de Tons**: Cria automaticamente tons mais claros e escuros
5. **Persistência**: A cor escolhida persiste entre sessões

## 🐛 Troubleshooting

### Erro: "column already exists"
**Causa**: A migration já foi executada antes

**Solução**: Não há problema! A coluna já existe. Pule para o passo 5 (Verificar)

### A cor não está mudando no sistema
**Soluções possíveis**:

1. **Limpar cache do navegador**:
   ```
   Ctrl + Shift + Delete → Limpar dados de navegação
   ```

2. **Hard refresh**:
   ```
   Ctrl + F5 (ou Ctrl + Shift + R)
   ```

3. **Verificar se o valor foi salvo**:
   ```sql
   SELECT id, nome, cor_primaria FROM salao;
   ```

4. **Reiniciar servidor**:
   ```powershell
   # Parar servidor (Ctrl+C)
   npm run dev
   ```

### Erro ao salvar na página Configurações
**Causa**: A migration não foi executada

**Solução**: Execute a migration SQL conforme o passo 3 acima

## 📸 Exemplo Visual

```
╔════════════════════════════════════════╗
║  Cor Principal do Sistema              ║
╠════════════════════════════════════════╣
║                                        ║
║  Cores Predefinidas:                   ║
║  ┌──┐ ┌──┐ ┌──┐ ┌──┐                  ║
║  │🟣│ │🌸│ │🔵│ │🟢│                  ║
║  └──┘ └──┘ └──┘ └──┘                  ║
║  ┌──┐ ┌──┐ ┌──┐ ┌──┐                  ║
║  │🟠│ │🔴│ │🔵│ │🟣│                  ║
║  └──┘ └──┘ └──┘ └──┘                  ║
║                                        ║
║  Cor Personalizada:                    ║
║  ┌────────────────┬──────┐             ║
║  │ #9333ea        │ 🎨   │             ║
║  └────────────────┴──────┘             ║
║                                        ║
║  Pré-visualização:                     ║
║  [Botão Principal] [Badge]             ║
║                                        ║
╚════════════════════════════════════════╝
```

## 🎯 Cores Predefinidas Disponíveis

| Cor      | Código    | Uso Sugerido              |
|----------|-----------|---------------------------|
| Roxo     | #9333ea   | Padrão elegante           |
| Rosa     | #ec4899   | Feminino e moderno        |
| Azul     | #3b82f6   | Profissional e confiável  |
| Verde    | #22c55e   | Natural e fresco          |
| Laranja  | #f97316   | Energético e vibrante     |
| Vermelho | #ef4444   | Ousado e impactante       |
| Ciano    | #06b6d4   | Moderno e tecnológico     |
| Índigo   | #6366f1   | Sofisticado e único       |

## 📁 Arquivos Criados/Modificados

### Criados:
- `supabase/migrations/003_add_primary_color.sql`
- `src/hooks/usePrimaryColor.ts`
- `src/components/ui/color-picker.tsx`

### Modificados:
- `src/schemas/salao.schema.ts`
- `src/components/configuracoes/SalaoForm.tsx`
- `src/components/layout/MainLayout.tsx`

---

**✅ Após executar a migration, a funcionalidade estará 100% operacional!**
