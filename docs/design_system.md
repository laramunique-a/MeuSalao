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

*   Altura padrão: `40px` (`h-10`).
*   Arredondamento: `12px` (`rounded-xl`).
*   Borda fina sutil (`#ECECEC` ou HSL `15 10% 93%`).
*   Focus: Borda se sobressai no tom de destaque com anel de foco minimalista.

### 3.3. Cards e Superfícies

*   Todos os cards usam fundo branco puro (`#ffffff` no Light Mode), sem bordas grossas, mas com sombras táteis e arredondamento generoso de `24px` (`rounded-3xl`).
*   No Modo Escuro, os cards usam o tom cinza-escuro tátil `#17181a` (`rounded-3xl` com sombra e borda fina).

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

