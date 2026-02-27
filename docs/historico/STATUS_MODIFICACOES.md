# 📋 Status das Modificações Solicitadas

## ✅ CONCLUÍDO

### A) Layout Geral - Header Fixo e Reorganização

1. ✅ **Header fixo no topo**
   - O header já era sticky (fixo no scroll)
   - Adicionado logo do estabelecimento no canto superior esquerdo
   - Adicionado nome do estabelecimento ao lado do logo
   - O logo e nome são carregados dinamicamente do Supabase

2. ✅ **Reorganização do menu**
   - "MeuSalão" movido para o footer do menu lateral esquerdo
   - Dashboard movido para dentro da sessão "Administração"
   - Nova ordem do menu:
     - Agenda
     - Clientes
     - Serviços
     - Caixa
     - **ADMINISTRAÇÃO:**
       - Dashboard
       - Relatórios
       - Configurações

**Arquivos Modificados:**
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`

---

## 🔄 EM ANDAMENTO

### B) Configurações - Alteração de Cor Principal

**Status:** Migration SQL criada, aguardando implementação da interface

**O que foi feito:**
- ✅ Criado migration SQL para adicionar campo `cor_primaria` na tabela `salao`
- ✅ Cor padrão definida como `#9333ea` (roxo atual)

**Arquivo Criado:**
- `supabase/migrations/003_add_primary_color.sql`

**O que falta fazer:**
1. Executar a migration no Supabase (SQL Editor)
2. Criar componente `ColorPicker` para seleção de cores
3. Adicionar campo na página de Configurações
4. Criar hook `usePrimaryColor` para aplicar a cor globalmente
5. Aplicar a cor dinamicamente nos elementos:
   - Botões primários
   - Links ativos no menu
   - Headers
   - Badges
   - Ícones destacados

---

## ⏳ PENDENTE

### C) Agenda - Múltiplas Melhorias

#### C1) Layout da Agenda (Lista/Colunas)
**Complexidade:** Alta  
**Descrição:** Implementar visualização em lista e colunas separadas por hora

**Tarefas:**
- [ ] Criar componente `AgendaListView` (atual)
- [ ] Criar componente `AgendaColumnView` (nova visualização em colunas)
- [ ] Adicionar toggle de visualização
- [ ] Implementar grid de horários (ex: 08:00, 08:15, 08:30...)
- [ ] Agrupar agendamentos por faixa de horário

#### C2) Navegação com Calendário
**Complexidade:** Média  
**Descrição:** Botão calendário principal, "Hoje" em menor destaque

**Tarefas:**
- [ ] Adicionar componente Calendar do shadcn/ui já instalado
- [ ] Criar botão com ícone de calendário
- [ ] Reduzir destaque visual do botão "Hoje" (variant="outline")
- [ ] Conectar seleção do calendário com filtro de data

#### C3) Cliente Não Cadastrado
**Complexidade:** Média  
**Descrição:** Permitir digitar nome livre + aviso pós-agendamento

**Tarefas:**
- [ ] Alterar campo Cliente para Combobox editável
- [ ] Adicionar lógica para detectar nome não cadastrado
- [ ] Criar dialog de confirmação após agendamento
- [ ] Implementar fluxo: "Deseja cadastrar o cliente?"
- [ ] Pré-preencher formulário de cliente com nome informado

#### C4) Horários 15 em 15 minutos
**Complexidade:** Baixa  
**Descrição:** Seletor com intervalos de 15min

**Tarefas:**
- [ ] Modificar `AgendamentoFormDialog`
- [ ] Gerar lista de horários: 00:00, 00:15, 00:30, 00:45, etc.
- [ ] Substituir input time por Select com opções de 15 em 15 minutos

#### C5) Validação Duração + Conflitos
**Complexidade:** Alta  
**Descrição:** Avisar conflitos e permitir ajustes

**Tarefas:**
- [ ] Validar sobreposição considerando duração do serviço
- [ ] Criar `ConflictWarningDialog` component
- [ ] Implementar opções:
  - Alterar horário (mostrar horários livres próximos)
  - Alterar dia (abrir calendário)
  - Confirmar mesmo assim (sobrescrever)

#### C6) Status no Horário do Atendimento
**Complexidade:** Alta  
**Descrição:** "Cliente chegou?" quando chegar a hora

**Tarefas:**
- [ ] Implementar verificação de horário em tempo real
- [ ] Adicionar badge/alerta "Cliente chegou?" no agendamento
- [ ] Criar botões Sim/Não inline
- [ ] Lógica: Sim → status "em_atendimento" + liberar no Caixa
- [ ] Lógica: Não → status "em_atraso" + manter pergunta ativa

#### C7) Cancelar ao Invés de Excluir
**Complexidade:** Baixa  
**Descrição:** Manter registro e mudar status para "Cancelado"

**Tarefas:**
- [ ] Renomear botão "Excluir" para "Cancelar"
- [ ] Alterar ação para UPDATE status='cancelado'
- [ ] Remover função de DELETE (ou restringir apenas para admins)
- [ ] Adicionar filtro para ocultar/mostrar cancelados

#### C8) Bloquear Agenda
**Complexidade:** Alta  
**Descrição:** Funcionalidade de bloqueio de períodos

**Tarefas:**
- [ ] Criar tabela `bloqueio_agenda` no Supabase:
  ```sql
  CREATE TABLE bloqueio_agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salao_id UUID NOT NULL REFERENCES salao(id),
    profissional_id UUID REFERENCES usuario(id),
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Criar serviço `bloqueioAgenda.service.ts`
- [ ] Criar hook `useBloqueios`
- [ ] Criar componente `BloqueioAgendaDialog`
- [ ] Validar horários bloqueados ao criar agendamento
- [ ] Exibir bloqueios visualmente na agenda

---

### D) Clientes - Máscara de Telefone

**Complexidade:** Baixa  
**Descrição:** Aplicar máscara `(xx) xxxxx-xxxx` automaticamente

**Tarefas:**
- [ ] Instalar biblioteca `react-input-mask` ou `react-number-format`
- [ ] Modificar `ClienteFormDialog.tsx`
- [ ] Aplicar máscara no campo telefone
- [ ] Validar formato antes de salvar

**Exemplo de implementação:**
```tsx
import InputMask from 'react-input-mask';

<InputMask
  mask="(99) 99999-9999"
  value={field.value}
  onChange={field.onChange}
>
  {(inputProps) => <Input {...inputProps} />}
</InputMask>
```

---

### E) Serviços - Formatação Valor R$

**Complexidade:** Baixa  
**Descrição:** Formato `xx,xx` com vírgula decimal

**Tarefas:**
- [ ] Modificar `ServicoFormDialog.tsx`
- [ ] Criar função de formatação:
  - Input: permitir apenas números e vírgula
  - Display: `XX,XX`
  - Salvar: converter para float (substituir vírgula por ponto)
- [ ] Aplicar formatação no campo "Valor (R$)"

**Exemplo de implementação:**
```tsx
const formatCurrency = (value: string) => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '')
  // Adiciona vírgula antes dos 2 últimos dígitos
  return (Number(numbers) / 100).toFixed(2).replace('.', ',')
}
```

---

## 📊 Resumo de Progresso

| Categoria | Status | Progresso |
|-----------|--------|-----------|
| A) Layout Geral | ✅ Concluído | 100% |
| B) Configurações - Cor | 🔄 Em Andamento | 30% |
| C1) Agenda - Layout | ⏳ Pendente | 0% |
| C2) Agenda - Calendário | ⏳ Pendente | 0% |
| C3) Agenda - Cliente Livre | ⏳ Pendente | 0% |
| C4) Agenda - Horários 15min | ⏳ Pendente | 0% |
| C5) Agenda - Conflitos | ⏳ Pendente | 0% |
| C6) Agenda - Cliente Chegou | ⏳ Pendente | 0% |
| C7) Agenda - Cancelar | ⏳ Pendente | 0% |
| C8) Agenda - Bloqueio | ⏳ Pendente | 0% |
| D) Clientes - Máscara | ⏳ Pendente | 0% |
| E) Serviços - Formato R$ | ⏳ Pendente | 0% |

**Total Geral: 12 itens** | ✅ 1 completo | 🔄 1 em andamento | ⏳ 10 pendentes

---

## 🚀 Próximos Passos Sugeridos

### Prioridade ALTA (funcionalidades críticas)
1. **C4) Horários 15 em 15 minutos** - Fácil e importante
2. **D) Máscara de telefone** - Fácil e melhora UX
3. **E) Formatação valor R$** - Fácil e melhora UX
4. **C7) Cancelar ao invés de Excluir** - Fácil e evita perda de dados

### Prioridade MÉDIA (melhorias significativas)
5. **B) Alteração de cor principal** - Visual importante
6. **C2) Navegação com calendário** - Melhora navegação
7. **C3) Cliente não cadastrado** - Agiliza processo

### Prioridade BAIXA (funcionalidades avançadas)
8. **C1) Layout Lista/Colunas** - Complexo, opcional
9. **C5) Validação de conflitos** - Complexo mas útil
10. **C6) Status no horário** - Requer lógica em tempo real
11. **C8) Bloquear agenda** - Funcionalidade avançada

---

## 📝 Comandos Úteis

### Executar Migration no Supabase
```sql
-- No SQL Editor do Supabase, execute:
ALTER TABLE salao 
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#9333ea';

UPDATE salao 
SET cor_primaria = '#9333ea' 
WHERE cor_primaria IS NULL;
```

### Instalar Dependências (se necessário)
```powershell
# Para máscara de input
npm install react-input-mask
npm install -D @types/react-input-mask

# Para formatação de números
npm install react-number-format
```

---

**Atualizado em:** 2026-02-17  
**Status:** Layout base concluído, aguardando implementação das demais funcionalidades
