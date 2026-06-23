# Design System & Style Guide (MeuSalão)

Este documento estabelece as diretrizes visuais e de interação oficiais para o projeto **MeuSalão**. Ele deve ser tratado como a **única fonte de verdade** para qualquer alteração ou criação de elementos de interface (UI).

---

## 1. Princípios de Design

*   **Foco Absoluto**: Apenas uma ação principal por tela. Elementos secundários ou ações menos frequentes devem permanecer ocultos ou discretos até que o usuário interaja.
*   **Hierarquia Clara**: A diferenciação visual das informações deve ser feita através de pesos tipográficos, tamanhos e espaçamentos (padding/margin), nunca por cores vibrantes ou sombras chamativas.
*   **Minimalismo Funcional**: Zero ornamentos. Cada linha, borda ou espaçamento deve possuir um propósito prático de legibilidade e separação de conteúdo.
*   **Velocidade e Resposta**: Transições de estado devem ser ultra suaves (150ms) e o feedback de interação deve parecer instantâneo para o usuário.

---

## 2. Fundações Visuais

### 2.1. Cores (Paleta Oficial)

O sistema de cores baseia-se em tons neutros, quentes e sutis, divididos entre o Modo Claro e o Modo Escuro.

| Elemento | Modo Claro (Hex) | Modo Claro (HSL) | Modo Escuro (Hex) | Modo Escuro (HSL) | Proporção de Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Background Principal** | `#FAFAF7` | `60 23% 97.5%` | `#0A0A0A` | `0 0% 4%` | **90%** (Superfícies) |
| **Texto Principal** | `#0A0A0A` | `0 0% 4%` | `#ECECEC` | `0 0% 93%` | Leitura primária |
| **Texto Secundário** | `#6B6B6B` | `0 0% 42%` | `#8E8E8E` | `0 0% 63%` | Metadados/Muted |
| **Bordas & Divisórias** | `#ECECEC` | `0 0% 93%` | `#1F1F1F` | `0 0% 12%` | Estrutura |
| **Cor de Destaque (CTA)**| `#1F1F1F` | `0 0% 12%` | `#FFFFFF` | `0 0% 98%` | **10%** (Ações) |

*Nota: Não é permitido o uso de degradês, cores néon ou tons de roxo/índigo como destaque visual dominante.*

### 2.2. Tipografia

O projeto utiliza duas famílias tipográficas carregadas do Google Fonts:

*   **Títulos e Cabeçalhos (`h1` a `h6` ou `.font-title`)**:
    *   **Fonte**: `Inter Tight`
    *   **Peso**: `500` (Medium)
    *   **Espaçamento (Tracking)**: Levemente reduzido (`letter-spacing: -0.025em`)
*   **Corpo de Texto e Parágrafos**:
    *   **Fonte**: `Inter`
    *   **Peso**: `400` (Regular) ou `500` (Medium para destaque de leitura)
    *   **Altura da Linha (Line-height)**: `1.6`

### 2.3. Espaçamentos (Grid de 8px)

Toda a diagramação horizontal e vertical segue múltiplos de 8px:

*   `8px` (2xs) – Espaço entre label e input, ou entre ícone e texto.
*   `16px` (xs) – Espaço entre campos de formulário relacionados.
*   `24px` (md) – Padding padrão de contêineres e listas.
*   `32px` (lg) – Distância entre grupos de formulários ou seções pequenas.
*   `64px` a `96px` (xl/2xl) – Espaçamento grande entre grandes seções de conteúdo.

### 2.4. Arredondamento (Bordas)

*   **Border Radius padrão**: **`10px`** (aplicado globalmente a botões, inputs, cards, modais e contêineres).
*   **Bordas físicas**: 1px sólidas.
*   **Sombras**: Estritamente proibidas para elementos de estrutura. Apenas permitidas sombras extremamente sutis (1px de espalhamento neutro) em popovers/dropdowns flutuantes sobrepostos.

---

## 3. Estrutura e Layout

### 3.1. Limite de Largura de Containers

*   **Páginas de Detalhes, Formulários e Configurações (Conteúdo Centralizado)**:
    *   Largura máxima: **`720px`** (otimizado para leitura e preenchimento vertical).
*   **Listagens, Agendas, Caixa, Relatórios e Tabelas de Dados**:
    *   Largura máxima: **`1120px`** (alta densidade de colunas e dados).

### 3.2. Navegação (Top Bar)

*   **Altura Fixa**: `56px` (`h-14` no Tailwind).
*   **Visual**: Sem logotipos coloridos, apenas o nome do sistema em texto minimalista.
*   **Itens**: Links de texto planos no lado esquerdo/centro, seletor de tema claro/escuro e avatar discreto no canto direito.
*   **Mobile**: Menu hambúrguer no lado esquerdo que abre uma gaveta (drawer) lateral contendo os links com background `#FAFAF7` (Light) ou `#0A0A0A` (Dark).

---

## 4. Padrões de Componentes

### 4.1. Botões

*   **Botão Primário**:
    *   Fundo plano `#1F1F1F` (Light) ou `#FFFFFF` (Dark).
    *   Texto branco (Light) ou preto (Dark).
    *   Sem sombras.
*   **Botão Secundário / Outline**:
    *   Fundo 100% transparente.
    *   Borda de 1px sólida (`#ECECEC` no Light / `#1F1F1F` no Dark).
    *   Texto cor principal (`#0A0A0A` no Light / `#ECECEC` no Dark).
*   **Estados**:
    *   *Hover*: Background sutilmente mais escuro em 2% (Light) ou 2% mais claro (Dark).
    *   *Active*: Efeito de escala suave (`scale: 0.98` ou classe `active:scale-95`).
    *   *Disabled*: Opacidade reduzida para 50%, interações desabilitadas.

### 4.2. Formulários

*   **Altura padrão dos campos**: `40px` (`h-10`).
*   **Inputs & Selects**:
    *   Borda sólida de 1px (`#ECECEC` no Light / `#1F1F1F` no Dark).
    *   Fundo neutro e fosco (igual ao background ou levemente translúcido).
    *   Sem sombras internas.
    *   *Focus*: Borda muda para o tom de destaque (`#1F1F1F` no Light / `#FFFFFF` no Dark), com anel de foco sutil de 1px (sem brilhos espalhados).
*   **Labels**: Sempre em caixa alta (uppercase) ou legíveis com tamanho menor (`text-xs`), peso `500` ou `600`, e cor secundária (`#6B6B6B` / `#8E8E8E`).

### 4.3. Tabelas

*   **Visual**: Linhas separadas por divisórias finas de 1px.
*   **Preenchimento**: Sem bordas verticais, apenas linhas horizontais.
*   **Densidade**: Altura reduzida de células para acomodar mais dados sem poluição visual.
*   **Cabeçalhos**: Texto menor, em tom secundário, alinhado à esquerda.

### 4.4. Modais e Popovers

*   **Rounding**: Cantos arredondados de `10px`.
*   **Bordas**: 1px sólida na cor da borda do sistema.
*   **Fundo**: Fundo plano opaco `#FAFAF7` (ou `#0A0A0A`).
*   **Animação**: Entrada sutil por fade ou subida suave de 150ms.

---

## 5. Padrões de Interação

*   **Duração da Transição**: 150ms.
*   **Curva de Transição**: `ease-out` (aceleração no início, desaceleração suave no fim).
*   **Scroll**: Barra de rolagem minimalista (fina e arredondada, sem trilha de background visível).
*   **Indicação de Atalhos**: Sempre que aplicável (ex: botões de busca, comandos), indicar a tecla de atalho de forma sutil, ex: `⌘K` ou `Ctrl+K` em caixa cinza discreta.

---

## 6. Práticas Proibidas (Blacklist Visual)

*   ❌ **Gradients**: Proibido o uso de degradês em backgrounds, botões ou cabeçalhos.
*   ❌ **Efeitos de Vidro (Glassmorphism)**: Não utilizar `backdrop-blur` com cores semitransparentes vibrantes.
*   ❌ **Neomorphism**: Sem efeitos de relevo ou sombras duplas.
*   ❌ **Emojis**: Não utilizar emojis para decorar a interface. Priorizar ícones lineares consistentes (Lucide React).
*   ❌ **Cores Dominantes Claras**: Roxo, azul, verde ou rosa não podem ser usados como cor dominante da UI. O visual deve ser essencialmente monocromático e neutro.
