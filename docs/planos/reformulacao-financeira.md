# Plano de Reformulação Financeira: Caixa com Valor Cheio e Pagamento de Comissão Desacoplado

## 1. Visão Geral e Contexto do Problema

Atualmente, o sistema apresenta dois atritos críticos que geram confusão na operação diária e divergências no fechamento de caixa:
1. **Entradas no Caixa com Valor Líquido de Taxas:** Ao dar baixa em um atendimento pago via cartão, o sistema grava na tabela `transacao_caixa` o `valor` já descontado das tarifas da maquininha. Isso faz com que o saldo do caixa diário não reflita o valor cobrado do cliente nem os comprovantes emitidos pela máquina de cartão, impossibilitando uma conferência simples no fechamento.
2. **Pagamento de Comissão Misturado ao Caixa Diário:** Ao registrar o pagamento de comissão de um profissional na tela de relatórios, o sistema lança uma **Saída Manual no Caixa Diário**. Como a maioria dos salões paga as comissões por PIX/transferência bancária ou em datas/fechamentos descompassados do caixa diário da recepção, o caixa diário fica com "saídas fantasmas", quebrando o fechamento físico e desregulando tanto o caixa quanto os relatórios.

---

## 2. Objetivos da Mudança

1. **Caixa com Valor Cheio (Bruto):** Todas as movimentações de serviços no caixa (`transacao_caixa`) passarão a registrar o **valor total cobrado do cliente**. O saldo do caixa corresponderá 100% à soma dos comprovantes de cartão + dinheiro + PIX na hora do fechamento.
2. **Cálculo da Comissão Preservado:** A base da comissão continuará deduzindo a tarifa da máquina antes do rateio (`base = bruto - taxa`), garantindo que o profissional receba exatamente a sua porcentagem justa e que a margem do salão continue protegida.
3. **Pagamento de Comissão 100% Desacoplado do Caixa:** Os repasses e pagamentos de comissão terão um fluxo e tabela próprios (`pagamento_comissao`), sem jamais interferir ou subtrair dinheiro do caixa diário da recepção.

---

## 3. Análise Detalhada de Impactos e Possíveis Quebras

| Área / Módulo | Comportamento Atual | Novo Comportamento | Riscos / Possíveis Quebras | Mitigação |
| :--- | :--- | :--- | :--- | :--- |
| **Baixa de Atendimentos (`DarBaixaDialog.tsx`)** | Grava `valor = liquido` na `transacao_caixa`. | Grava `valor = bruto` na `transacao_caixa`. A taxa continua registrada em `taxa_cartao` e no `metadata`. | O cálculo da comissão poderia pegar o bruto por engano. | Manter explícito no código: `comissao_valor = (liquido * percentual) / 100`. |
| **Fechamento de Caixa (`FecharCaixaDialog.tsx` e `Caixa.tsx`)** | Saldo do sistema somava o valor líquido de cartão. | Saldo do sistema soma o valor cheio das vendas menos as despesas operacionais da loja. | Histórico de caixas antigos que foram fechados antes da mudança. | Caixas antigos já fechados (`status = 'fechado'`) mantêm seus valores gravados e congelados nas colunas `valor_fechamento_sistema` e `valor_fechamento_informado`, sem recalcular retroativamente. |
| **Pagamento de Comissões (`Relatorios.tsx`)** | Lançava uma `saida` em `transacao_caixa` com categoria `'Pagamento de Comissão'`. | Lança um registro na tabela dedicada `pagamento_comissao`, sem tocar em `transacao_caixa`. | Histórico de comissões já pagas no passado antes da criação da nova tabela. | A consulta de comissões pagas buscará na nova tabela `pagamento_comissao` e terá script de migração para copiar os pagamentos antigos de `transacao_caixa` para a nova tabela. |
| **Menu Caixa (`MovimentacaoManualDialog.tsx`)** | Tinha a opção de selecionar "Pagamento de Comissão" como saída de caixa. | Opção "Pagamento de Comissão" é **removida** do caixa diário. Caixa diário só aceita: Entrada Manual, Saída Operacional, Retirada/Sangria e Ajuste. | Operador do caixa tentar pagar comissão pelo caixa físico. | O caixa físico passa a ter apenas movimentações operacionais do salão. Repasses de comissões são feitos exclusivamente na aba Comissões. |
| **Relatório de Comissões e Folha (`Relatorios.tsx`)** | Consultava `transacao_caixa` filtrando por `categoria = 'Pagamento de Comissão'`. | Consulta a tabela dedicada `pagamento_comissao`. | Se a migration não for executada no Supabase imediatamente. | Suporte resiliente no código: se a tabela nova estiver populada, usa ela; se houver registros legados, consolida. |

---

## 4. Modificações Propostas

### A. Banco de Dados (Supabase)
#### [NEW] [014_create_pagamento_comissao.sql](file:///home/laramunique/Projetos/Munix/supabase/migrations/014_create_pagamento_comissao.sql)
- Criar a tabela `pagamento_comissao`:
  - `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
  - `salao_id UUID NOT NULL REFERENCES salao(id) ON DELETE CASCADE`
  - `profissional_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE`
  - `usuario_id UUID NOT NULL REFERENCES usuario(id)` (quem registrou)
  - `valor NUMERIC(10, 2) NOT NULL`
  - `forma_pagamento TEXT NOT NULL DEFAULT 'pix'` (`pix`, `transferencia`, `dinheiro`, `outros`)
  - `data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `observacoes TEXT`
  - `status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'estornado'))`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Políticas de Row Level Security (RLS):
  - Administradores do salão podem gerenciar (SELECT, INSERT, UPDATE).
  - Profissionais podem visualizar apenas os seus próprios repasses (SELECT).
- Script opcional de migração para migrar registros legados de `transacao_caixa` onde `categoria = 'Pagamento de Comissão'` para a nova tabela `pagamento_comissao`.

---

### B. Tipagens do Sistema
#### [MODIFY] [models.ts](file:///home/laramunique/Projetos/Munix/src/types/models.ts)
- Adicionar a interface `PagamentoComissao`:
  ```typescript
  export interface PagamentoComissao {
    id: string
    salao_id: string
    profissional_id: string
    usuario_id: string
    valor: number
    forma_pagamento: string
    data_pagamento: string
    observacoes?: string | null
    status: 'pago' | 'estornado'
    created_at: string
    updated_at: string
    profissional?: Usuario
    usuario?: Usuario
  }
  ```
#### [MODIFY] [database.types.ts](file:///home/laramunique/Projetos/Munix/src/types/database.types.ts)
- Incluir definições da tabela `pagamento_comissao` para garantir tipagem rigorosa no Supabase client.

---

### C. Módulo de Caixa e Baixa
#### [MODIFY] [DarBaixaDialog.tsx](file:///home/laramunique/Projetos/Munix/src/components/caixa/DarBaixaDialog.tsx)
- No momento de gerar as transações de entrada (Parte 1 e Parte 2 do split):
  - Salvar `valor: bruto1` (em vez de `liquido1`).
  - Manter `taxa_cartao: taxa1` registrado.
  - Manter `comissao_valor: comissao1` (calculado sobre a base líquida de tarifas, preservando a dedução).
  - Atualizar os itens do breakdown de comissão para exibir o valor cheio do serviço e a comissão justa.
- Desta forma, o extrato de movimentações e o saldo do caixa somarão o **valor integral cobrado do cliente**.

#### [MODIFY] [MovimentacaoManualDialog.tsx](file:///home/laramunique/Projetos/Munix/src/components/caixa/MovimentacaoManualDialog.tsx)
- Remover o tipo `'comissao'` das opções de movimentação do caixa diário.
- Manter apenas:
  - Entrada Manual
  - Saída Manual (despesas operacionais)
  - Retirada de Caixa (sangria para cofre)
  - Ajuste de Caixa (correção de contagem física)
- Isso blinda o caixa contra retiradas de folha de pagamento que não ocorreram na gaveta física.

---

### D. Módulo de Comissões e Relatórios
#### [NEW] [RegistrarPagamentoComissaoDialog.tsx](file:///home/laramunique/Projetos/Munix/src/components/relatorios/RegistrarPagamentoComissaoDialog.tsx)
- Modal dedicado e especializado para repasse de comissões:
  - Seleção do profissional e exibição do saldo pendente atual.
  - Campo de valor do pagamento (padrão preenchido com o saldo, permitindo pagamento parcial).
  - Forma de repasse: **PIX**, **Transferência Bancária**, **Dinheiro (fora do caixa)** ou **Outros**.
  - Data e hora do repasse.
  - Campo de observações (ex: "Adiantamento quinzena", "PIX chave CPF").
  - Grava diretamente em `pagamento_comissao` e NÃO gera transação em `transacao_caixa`.

#### [MODIFY] [relatorios.service.ts](file:///home/laramunique/Projetos/Munix/src/services/relatorios.service.ts)
- Atualizar `getFolhaPagamentoReport`:
  - Consultar a tabela `pagamento_comissao` (com fallback retrocompatível se houver dados legados).
- Atualizar `getSaldosComissoesReport`:
  - `gerado`: continua somando as comissões dos atendimentos em `transacao_caixa` (base líquida de tarifas, respeitando o rateio configurado).
  - `pago`: consulta os repasses registrados em `pagamento_comissao`.
  - `saldo_pendente`: `gerado - pago`.
- Adicionar métodos:
  - `registrarPagamentoComissao(dados)`: insere na tabela `pagamento_comissao`.
  - `estornarPagamentoComissao(id)`: atualiza o status para `'estornado'`.

#### [MODIFY] [Relatorios.tsx](file:///home/laramunique/Projetos/Munix/src/pages/Relatorios.tsx)
- Substituir o uso de `MovimentacaoManualDialog` no botão "Pagar Comissão" pelo novo `RegistrarPagamentoComissaoDialog`.
- A listagem de "Histórico de Pagamentos de Comissões" passará a listar os repasses da nova estrutura com badges limpos e detalhados.

---

## 5. Plano de Verificação e Validação

### Testes Automatizados e de Compilação:
- Executar `npm run build` para garantir ausência de erros de TypeScript e imports.
- Validar tipos em `database.types.ts` e `models.ts`.

### Testes Manuais de Fluxo:
1. **Fluxo de Atendimento e Caixa com Valor Cheio:**
   - Agendar um serviço de R$ 100,00 com profissional com comissão de 50% e taxa de cartão de 5%.
   - Dar baixa no atendimento selecionando Cartão de Crédito.
   - **Resultado Esperado:** 
     - No Caixa, a entrada consta como **R$ 100,00** (valor cheio).
     - O saldo do caixa aumenta em **R$ 100,00**.
     - A taxa de R$ 5,00 fica salva no registro para fins de controle.
2. **Fluxo do Relatório de Comissões:**
   - Acessar **Relatórios > Comissões**.
   - **Resultado Esperado:**
     - A comissão gerada para o profissional é de **R$ 47,50** (50% sobre a base líquida de R$ 95,00, exatamente como o salão opera hoje).
3. **Fluxo de Pagamento de Comissão Independente:**
   - Clicar em "Pagar Comissão" para o profissional no valor de R$ 47,50 via PIX.
   - Confirmar o repasse no novo dialog.
   - **Resultado Esperado:**
     - O saldo pendente do profissional no relatório vai para **R$ 0,00**.
     - O pagamento aparece no Histórico de Pagamentos com status "Pago".
     - **O Caixa Diário NÃO sofre NENHUMA alteração:** o saldo do caixa permanece intacto, sem nenhuma saída registrada.
     - O fechamento do caixa diário continua batendo com a soma dos comprovantes e do dinheiro da gaveta.
