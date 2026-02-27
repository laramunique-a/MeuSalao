# Atualização: Adicionar Status "Em Atraso" aos Agendamentos

## Contexto

Foi implementada a funcionalidade C6 (Status no horário) que adiciona um novo status `em_atraso` aos agendamentos.

## O que foi implementado

✅ **Funcionalidade "Cliente chegou?"**
- Quando o horário do agendamento chegar (com tolerância de 15min antes), aparece um prompt no card do agendamento
- Duas opções:
  - **Sim**: Altera status para `em_atendimento` e disponibiliza no Caixa
  - **Não**: Altera status para `em_atraso` e mantém o prompt ativo

✅ **Novo Status: "Em Atraso"**
- Badge laranja para identificar visualmente
- Agendamentos em atraso continuam mostrando o prompt "Cliente chegou?"
- Não ficam disponíveis no Caixa enquanto não confirmada a chegada

## Passo a Passo para Atualizar o Supabase

### 1. Acessar o SQL Editor no Supabase

1. Acesse o Supabase: https://supabase.com
2. Selecione seu projeto **MeuSalão**
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New query**

### 2. Executar a Migration

Copie e cole o seguinte SQL no editor:

```sql
-- Adicionar status 'em_atraso' ao CHECK constraint da tabela agendamento

-- Remover constraint antiga
ALTER TABLE agendamento DROP CONSTRAINT IF EXISTS agendamento_status_check;

-- Adicionar nova constraint com 'em_atraso'
ALTER TABLE agendamento ADD CONSTRAINT agendamento_status_check 
  CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'em_atraso', 'concluido', 'cancelado'));
```

### 3. Executar

1. Clique em **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a confirmação: "Success. No rows returned"

### 4. Verificar

Para confirmar que a migration foi aplicada corretamente, execute:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'agendamento_status_check';
```

Deve retornar uma linha com a constraint mostrando os 6 status: `agendado`, `confirmado`, `em_atendimento`, `em_atraso`, `concluido`, `cancelado`.

## Como Usar no Sistema

### Cenário de Uso

1. **15 minutos antes do horário agendado**, o sistema já começa a exibir o prompt "Cliente chegou?"
2. **No horário ou após o horário**, o prompt continua visível
3. O profissional responde:
   - **Sim**: Cliente confirmado → Status muda para "Em Atendimento" → Disponível no Caixa
   - **Não**: Status muda para "Em Atraso" → Prompt continua visível → Não vai para o Caixa

### Fluxo Completo

```
Agendamento Criado (status: agendado)
         ↓
Chegou 15min antes ou no horário
         ↓
Exibe "Cliente chegou?"
         ↓
    ┌─────┴─────┐
    │           │
  [Sim]       [Não]
    │           │
    ↓           ↓
Em Atendimento  Em Atraso
(vai p/ Caixa)  (prompt continua)
                    ↓
              Cliente chega depois?
                    ↓
                  [Sim]
                    ↓
              Em Atendimento
```

## Troubleshooting

### Erro: "permission denied"
- Certifique-se de estar usando uma conta com permissões de administrador no Supabase

### Erro: "constraint already exists"
- A migration já foi aplicada anteriormente
- Pode prosseguir normalmente

### Prompt "Cliente chegou?" não aparece
- Verifique se o status do agendamento é `agendado` ou `em_atraso`
- Confirme que o horário atual está dentro da tolerância (15min antes até infinito depois)
- Atualize a página para forçar o recálculo

## Próximas Tarefas Pendentes

Após aplicar esta migration, ainda faltam implementar:

- ⏳ **C1) Layout colunas** - Visualização em colunas da agenda
- ⏳ **C8) Bloquear agenda** - Funcionalidade para bloqueio de períodos

---

**Última atualização**: 2026-02-17
