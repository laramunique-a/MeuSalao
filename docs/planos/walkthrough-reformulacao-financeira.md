# Walkthrough: Reformulação Financeira (Caixa com Valor Cheio e Pagamento de Comissão Desacoplado)

Todas as alterações foram implementadas, validadas com sucesso via `npm run build` e enviadas para a branch remota **`teste-caixa-comissoes`**.

---

## 1. O Que Foi Alterado

### A. Caixa Diário com Valor Cheio (Bruto)
- **Arquivo:** [`DarBaixaDialog.tsx`](file:///home/laramunique/Projetos/Munix/src/components/caixa/DarBaixaDialog.tsx)
- **Mudança:** As entradas de atendimentos no caixa (`transacao_caixa.valor`) agora registram o **valor integral cobrado do cliente** (valor bruto).
- **Taxa da Maquininha:** A taxa continua sendo calculada e salva nos campos `taxa_cartao` e no `metadata.pagamento` para fins de controle e conciliação bancária, porém ela **não abate mais o saldo de vendas do caixa diário**.
- **Resultado:** No fechamento do caixa, a soma das transações bate centavo por centavo com a soma dos comprovantes de cartão emitidos pela máquina + dinheiro da gaveta + comprovantes PIX.

---

### B. Cálculo de Comissão Justo Preservado
- **Arquivo:** [`DarBaixaDialog.tsx`](file:///home/laramunique/Projetos/Munix/src/components/caixa/DarBaixaDialog.tsx) e [`relatorios.service.ts`](file:///home/laramunique/Projetos/Munix/src/services/relatorios.service.ts)
- **Mudança:** A base de cálculo da comissão continua descontando a tarifa da maquininha antes de aplicar o percentual:
  $$\text{Base da Comissão} = \text{Valor Bruto} - \text{Taxa da Maquininha}$$
  $$\text{Comissão do Profissional} = \text{Base} \times \text{Percentual}$$
- **Resultado:** A margem de lucro do salão continua protegida e os profissionais recebem exatamente o percentual contratado sobre o valor líquido.

---

### C. Pagamento de Comissão 100% Desacoplado do Caixa Diário
1. **Nova Tabela no Banco de Dados:**
   - **Arquivo:** [`014_create_pagamento_comissao.sql`](file:///home/laramunique/Projetos/Munix/supabase/migrations/014_create_pagamento_comissao.sql)
   - Tabela dedicada `pagamento_comissao` com RLS, índices e script de migração para registros legados.
2. **Novo Modal de Pagamento de Comissão:**
   - **Arquivo:** [`RegistrarPagamentoComissaoDialog.tsx`](file:///home/laramunique/Projetos/Munix/src/components/relatorios/RegistrarPagamentoComissaoDialog.tsx)
   - Localizado exclusivamente em **Relatórios > Comissões** (botão "Pagar Comissão").
   - Permite registrar o repasse indicando a forma (PIX, Transferência, Dinheiro fora do caixa), valor (total ou parcial), data e observações.
   - **NÃO toca e NÃO gera saídas em `transacao_caixa`**.
3. **Blindagem do Caixa Diário:**
   - **Arquivo:** [`MovimentacaoManualDialog.tsx`](file:///home/laramunique/Projetos/Munix/src/components/caixa/MovimentacaoManualDialog.tsx)
   - A opção "Pagamento de Comissão" foi removida das opções de movimentação do caixa físico. O operador da recepção agora registra apenas movimentações operacionais do salão (Entrada Manual, Saída de Despesa da Loja, Sangria e Ajuste).
4. **Proteção de Caixas Abertos e Fechamento:**
   - **Arquivos:** [`caixa.service.ts`](file:///home/laramunique/Projetos/Munix/src/services/caixa.service.ts), [`FecharCaixaDialog.tsx`](file:///home/laramunique/Projetos/Munix/src/components/caixa/FecharCaixaDialog.tsx), [`useCaixa.ts`](file:///home/laramunique/Projetos/Munix/src/hooks/useCaixa.ts) e [`Caixa.tsx`](file:///home/laramunique/Projetos/Munix/src/pages/Caixa.tsx)
   - Caso existam registros legados de comissões em `transacao_caixa`, eles são automaticamente ignorados no cálculo de saldo do caixa diário, impedindo qualquer distorção no fechamento.

---

## 2. Passo para Ativar a Tabela no Supabase

Para criar a nova tabela `pagamento_comissao` no seu banco de dados Supabase:
1. Acesse o **Dashboard do Supabase**.
2. Vá em **SQL Editor**.
3. Copie e cole o conteúdo do arquivo [`014_create_pagamento_comissao.sql`](file:///home/laramunique/Projetos/Munix/supabase/migrations/014_create_pagamento_comissao.sql).
4. Clique em **Run**.

---

## 3. Validação Realizada

- **Compilação e Verificação de Tipos:** `npm run build` executado com sucesso (código de saída 0).
- **Git Branch:** Trabalho isolado na branch remota `teste-caixa-comissoes`.
