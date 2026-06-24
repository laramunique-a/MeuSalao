# Design System & Style Guide: Luminous Salon "3D Edition" (MeuSalão)

Este documento estabelece as diretrizes visuais e de interação oficiais para o projeto **MeuSalão** na versão **3D Edition**. Ele deve ser tratado como a **única fonte de verdade** para qualquer alteração ou criação de elementos de interface (UI).

---

## 1. Princípios de Design e Estética

*   **Minimalismo Tátil / Soft 3D**: Uma interface limpa, leve e moderna que utiliza profundidade e elevação física sutil para criar hierarquia visual, sem depender de cores vibrantes ou ruído visual.
*   **Hierarquia por Elevação**: Os elementos interativos e principais cards flutuam sobre um fundo off-white suave, utilizando sombras amplas e desfocadas para demarcar sua importância.
*   **Leveza Visual**: Cores neutras dominantes com acentos discretos e tons pastéis para estados de feedback.

---

## 2. Fundações Visuais

### 2.1. Cores (Paleta Oficial)

| Elemento | Modo Claro (Hex) | Modo Claro (HSL) | Modo Escuro (Hex) | Modo Escuro (HSL) | Proporção / Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Background Principal** | `#f6f3f2` | `15 10% 96%` | `#0f1011` | `210 5% 6%` | **Fundo Base (Tátil)** |
| **Superfícies (Cards/Modais)**| `#ffffff` | `0 0% 100%` | `#17181a` | `210 6% 10%` | **Cards de Conteúdo** |
| **Texto Principal** | `#1a1c1e` | `210 7% 11%` | `#eaebec` | `210 10% 93%` | Leitura primária |
| **Texto Secundário** | `#6B6B6B` | `0 0% 42%` | `#8E8E8E` | `0 0% 63%` | Metadados/Muted |
| **Bordas & Divisórias** | `#ECECEC` | `15 10% 93%` | `#242629` | `210 6% 16%` | Divisórias e bordas |
| **Cor de Destaque (CTA)**| `#1a1c1e` | `210 7% 11%` | `#ffffff` | `0 0% 100%` | Botões primários / Destaque |

*Nota: Tons pastéis são utilizados unicamente para badges sutilizados de feedback (verde para concluído/pago, âmbar para pendente/atraso).*

### 2.2. Tipografia

O projeto utiliza a família tipográfica **Outfit** carregada do Google Fonts:

*   **Títulos e Cabeçalhos (`h1` a `h6` ou `.font-title`)**:
    *   **Fonte**: `Outfit`
    *   **Peso**: `600` (SemiBold) ou `700` (Bold)
    *   **Espaçamento (Tracking)**: Levemente reduzido (`letter-spacing: -0.02em`)
*   **Corpo de Texto e Parágrafos**:
    *   **Fonte**: `Outfit`
    *   **Peso**: `400` (Regular) ou `500` (Medium)
    *   **Altura da Linha (Line-height)**: `1.6`

### 2.3. Espaçamentos (Grid de 8px)

*   `8px` (2xs) – Espaço entre label e input, ou entre ícone e texto.
*   `16px` (xs) – Espaço entre campos de formulário relacionados.
*   `24px` (md) – Padding padrão de contêineres e listas.
*   `32px` (lg) – Distância entre seções ou grupos de formulários.

### 2.4. Arredondamento (Bordas) & Sombras (3D)

*   **Superfícies (Cards, Containers, Modais)**: **`16px a 24px`** (`rounded-2xl` a `rounded-3xl` no Tailwind).
*   **Elementos menores (Botões, Inputs, Badges)**: **`12px`** (`rounded-md` ou `rounded-xl`).
*   **Elevação de Cards (Nível 1)**: Sombras extremamente suaves e amplas para flutuação (`box-shadow: 0 10px 30px rgba(0,0,0,0.03)`).
*   **Elevação de Hover (Nível 2)**: Cards interativos sobem levemente (`translate-y: -2px`) e a sombra se aprofunda ligeiramente no hover.

---

## 3. Padrões de Componentes

### 3.1. Botões

*   **Botão Primário**:
    *   Fundo preto sólido `#1a1c1e` (Light) ou `#ffffff` (Dark).
    *   Texto branco (Light) ou preto (Dark).
    *   Cantos arredondados de `12px` (`rounded-xl`).
*   **Botão Secundário / Outline**:
    *   Fundo cinza-claro tátil ou transparente com borda fina.
*   **Efeito Interativo**:
    *   *Hover*: Elevação ou escurecimento leve.
    *   *Active*: `scale: 0.98` (classe `active:scale-95`).

### 3.2. Inputs e Campos de Formulário

*   **Altura padrão**: `40px` (`h-10`).
*   **Arredondamento**: `12px` (`rounded-md` no Tailwind, dado que `borderRadius.md` está mapeado como `12px` no arquivo de configuração).
*   **Rótulos (Labels)**: Estilo condensado tátil: `font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block` para uma legibilidade limpa e foco estrutural.
*   **Borda**: Fina e sutil (`border border-border` ou HSL `15 10% 93%`).
*   **Focus**: A borda destaca-se no tom de destaque da aplicação, com anel de foco tátil suave.

### 3.3. Cards e Superfícies

*   Todos os cards usam fundo branco puro (`#ffffff` no Light Mode), sem bordas grossas, mas com sombras táteis e arredondamento generoso de `24px` (`rounded-3xl`).
*   No Modo Escuro, os cards usam o tom cinza-escuro tátil `#17181a` (`rounded-3xl` com sombra e borda fina).

### 3.4. Componentes e Contêineres do Módulo Agenda

Para unificar o visual da Agenda e manter a consistência tátil 3D, todos os elementos interativos de primeiro nível seguem o padrão de **40px de altura (`h-10`)** e **20px de raio de curvatura (`rounded-xl`)**.

*   **AgendaButton**:
    *   **Propósito**: Ações principais do módulo (ex: "Novo", "Bloquear", botões de rodapé de formulários e modais).
    *   **Estética**: 40px de altura, cantos `rounded-xl` (20px), texto uppercase, peso `font-bold`, espaçamento `tracking-wider` e efeitos táteis:
        *   *Hover*: Leve elevação com tradução de `-1px` no eixo Y (`hover:translate-y-[-1px]`) com transição suave.
        *   *Active*: Encolhimento dinâmico de feedback para `scale-[0.98]`.
*   **AgendaFilterButton**:
    *   **Propósito**: Acionadores de filtros e dropdowns (ex: Calendário, Status, Profissional).
    *   **Estética**: Borda sutil, fundo tátil que reage ao estado de ativo (`active` adiciona destaque de cor e peso).
*   **Regra de Hierarquia Geométrica (Nested Radii)**:
    *   Para botões internos agrupados (como seletores de data e alternadores de visualização) inseridos em contêineres externos `rounded-xl` com padding sutil (`p-0.5` ou `p-1`), os botões internos devem usar **arredondamento proporcional de `16px` (`rounded-lg`)** e altura interna proporcional (como `h-9` ou `h-8`).
    *   Isso segue a fórmula: $R_{\text{externo}} = R_{\text{interno}} + P$ (Raio Externo = Raio Interno + Padding), garantindo que as curvas interna e externa permaneçam geometricamente concêntricas e visualmente harmônicas.

### 3.5. Tabelas e Listagens

Para garantir a consistência visual no gerenciamento de listagens e dados tabulares (ex: Serviços, Usuários):

*   **Contêiner Responsivo**:
    -   Toda tabela deve ser envolta por um contêiner com rolagem horizontal no mobile: `className="rounded-md border overflow-x-auto w-full"`.
    -   A tabela em si deve ter largura mínima para evitar encolhimento de colunas: `className="min-w-[600px] md:min-w-full"`.
*   **Cabeçalho da Tabela (`TableHead`)**:
    -   Altura fixa: `40px` (`h-10`).
    -   Estilo de fonte condensada: `text-[10px] font-bold uppercase tracking-wider text-muted-foreground`.
*   **Linhas e Células (`TableRow` / `TableCell`)**:
    -   Altura padrão de linha confortável: padding vertical de `12px` (`py-3`) nas células corporais.
    -   Alinhamento: dados básicos alinhados à esquerda, ações e controle de status alinhados à direita (text-right).
*   **Coluna de Status**:
    -   Controles de ativação/desativação e seus badges de estado devem ficar juntos na mesma célula para otimização de espaço, em escala reduzida: `flex items-center gap-2 scale-90 origin-left`.
*   **Botões de Ação**:
    -   Ghost buttons arredondados e de tamanho reduzido: `h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all rounded-lg` com ícones `h-3.5 w-3.5` (ex: `Pencil`, `Trash2`).

---

## 4. Animações e Navegação

### 4.1. Animação de Itens Ativos (Menu)

Para manter a consistência tátil 3D, todo item de menu selecionado (ativo) deve aplicar a animação de pulso suave e elevação física:
- **Classe CSS:** `.active-menu-item`
- **Comportamento:** A escala do botão oscila sutilmente entre `1` e `1.02`, e a sombra tátil se expande ligeiramente de forma contínua em um ciclo de 2 segundos.
- **Implementação:**
  ```css
  @keyframes active-menu-highlight {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  ```

### 4.2. Padronização de Submenus (Tabs/Navegação Secundária)

Todos os submenus de abas (ex: Caixa, Relatórios, Configurações) devem seguir a estrutura tátil em camadas (soft depth):
1. **Container Externo (Card Base):** Fundo branco (`bg-card`), arredondamento de 16px a 24px, sombra suave e borda sutil.
   - Classes recomendadas: `bg-card p-3 rounded-lg border border-border`
2. **Container Interno (Tabs Wrapper):** Fundo cinza tátil (`bg-background` no modo claro), recuado, com bordas finas.
   - Classes recomendadas: `flex items-center gap-1 bg-background rounded-lg border border-border p-0.5 w-fit`
3. **Triggers/Botões das Abas:** Estilo pílula.
   - **Ativo:** Fundo cinza-tátil médio (`bg-accent`), texto de contraste e peso em negrito (`font-bold`).
   - **Inativo:** Texto cinza-médio (`text-muted-foreground`) com hover para texto escuro (`hover:text-foreground`).
   - Classes recomendadas: `px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors`

### 4.3. Padronização de Painéis de Conteúdo das Abas (Submenu Content Panels)

Para garantir consistência visual em todas as páginas configuráveis com abas (ex: Configurações, Relatórios), os painéis de conteúdo (`TabsContent`) devem seguir o **Padrão Serviços** (Card Unificado):

1.  **Card Principal (`Card`):**
    -   Fundo branco ou superfície tátil (`bg-card`), arredondamento concêntrico e borda fina.
    -   Classes: `border border-border overflow-hidden rounded-lg bg-card`
2.  **Cabeçalho do Card (`CardHeader`):**
    -   Fundo cinza-tátil com realce suave e borda inferior demarcada.
    -   Classes: `border-b border-border bg-accent/20 py-4 px-6`
    -   **Título (`CardTitle`):** Caixa alta, negrito, tamanho reduzido: `text-sm font-semibold uppercase tracking-wider text-foreground`. Sem ícones decorativos grandes no título para manter o minimalismo tátil.
    -   **Descrição (`p`):** Tamanho extra pequeno, tom cinza-médio: `text-xs text-muted-foreground mt-0.5`.
3.  **Área de Ações do Cabeçalho:**
    -   Elementos de ação adicionais (ex: botões "+ Novo", badges de contagem, seletores rápidos) devem ficar alinhados à direita no cabeçalho através de um contêiner flexbox: `flex items-center gap-4`.
4.  **Conteúdo do Card (`CardContent`):**
    -   Classes: `p-6` (ou `p-0` se contiver tabelas ou elementos que tocam as bordas) para consistência no respiro visual.
