# 08 — Design System (Tailwind v4 + shadcn/ui)

A v2 usa **Tailwind CSS v4** (configuração CSS-first) com **shadcn/ui** sobre
Radix. Tokens semânticos garantem tema claro/escuro automático e contraste
acessível.

## 8.1 Princípios

- **CSS-first (v4):** sem `tailwind.config.js` de tema; tudo em CSS via `@theme`.
  Engine Oxide, nesting nativo, container queries nativas.
- **Tokens semânticos**, não cores cruas: `bg-background`, `text-foreground`,
  `bg-primary`, `border-border`. Nada de `dark:` para cores semânticas — o token
  troca sozinho.
- **shadcn/ui** como base de componentes acessíveis (Radix cuida de teclado/ARIA).
- **`cn()`** (clsx + tailwind-merge) para classes condicionais.

## 8.2 A arquitetura de 4 passos (obrigatória)

Pular passos quebra o tema. (Em Next.js App Router o CSS entra via
`app/globals.css`; o padrão de tokens é idêntico ao do guia Vite.)

### Passo 1 — Variáveis no nível raiz (com `hsl()`)

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222 47% 11%);
  --card: hsl(0 0% 100%);
  --primary: hsl(160 84% 39%);          /* verde retrô da marca */
  --primary-foreground: hsl(0 0% 100%);
  --muted-foreground: hsl(215 16% 47%);
  --border: hsl(214 32% 91%);
  --ring: hsl(160 84% 39%);
  /* semânticas de status */
  --destructive: hsl(0 72% 51%);
  --success: hsl(142 71% 45%);
  --warning: hsl(38 92% 50%);
  --info: hsl(221 83% 53%);
}

.dark {
  --background: hsl(222 47% 6%);
  --foreground: hsl(210 40% 98%);
  --card: hsl(222 40% 9%);
  --primary: hsl(160 84% 45%);
  --primary-foreground: hsl(222 47% 6%);
  --muted-foreground: hsl(215 20% 65%);
  --border: hsl(217 33% 17%);
  --ring: hsl(160 84% 45%);
}
```

> ✅ Defina `:root`/`.dark` **fora** de `@layer base`. ✅ Use `hsl()` nos valores.
> ❌ Nunca `.dark { @theme {} }` (v4 não suporta `@theme` aninhado).

### Passo 2 — Mapear variáveis → utilitários

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```
Sem este bloco, `bg-primary`/`text-foreground` **não existem**.

### Passo 3 — Estilos base (variáveis sem `hsl()`)

```css
@layer base {
  body {
    background-color: var(--background);   /* NÃO hsl(var(--background)) */
    color: var(--foreground);
  }
  * { border-color: var(--border); }
}
```

### Passo 4 — Resultado: dark mode automático

```tsx
<div className="bg-card text-foreground border border-border">
  {/* sem variantes dark: — o token troca sozinho */}
</div>
```

## 8.3 Dark mode

- `ThemeProvider` (next-themes ou implementação própria) com `class` em `<html>`
  (`.dark`), persistência em `localStorage`, opção "sistema".
- Toggle acessível (botão com `aria-label`, ícone `aria-hidden`).

## 8.4 Setup do shadcn/ui (v4)

```jsonc
// components.json
{ "tailwind": { "config": "", "css": "app/globals.css", "cssVariables": true } }
```
- `"config": ""` (vazio — v4). Não existe `tailwind.config.ts`.
- **Não** instalar `tailwindcss-animate`/`tw-animate-css` (descontinuados em v4);
  usar animações nativas/CSS.
- Componentes shadcn usados: `Button`, `Dialog`, `DropdownMenu`, `Tabs`,
  `Command` (combobox de busca), `Form` (+ react-hook-form + zod), `Badge`,
  `Card`, `Toast`/Sonner, `Tooltip`, `Sheet` (filtros mobile).

## 8.5 Tokens além de cor

- **Tipografia:** `--font-sans` (Inter), `--font-mono` (JetBrains Mono). Escala
  `text-xs…text-xl+`. Plugin `@plugin "@tailwindcss/typography"` (`prose`) para
  o corpo de artigos renderizado — com `prose-invert` no escuro.
- **Espaçamento/raios:** escala padrão; `--radius` para cantos.
- **Layout:** preferir **container queries** (`@container`) em componentes
  reutilizáveis (card de device, bloco de artigo) e breakpoints de viewport só no
  layout de página. Grids **bento/assimétricos** em vez de 3 colunas simétricas.

## 8.6 Componentes do design system (mapeando da v1)

| v1 (Fumadocs/MDX) | v2 (bloco + UI) |
|---|---|
| `ConsoleOverview` | `DeviceSpecCard` (catálogo + bloco `device-spec`) |
| `FirmwareList` | bloco `github-releases` (ver [06](./06-componentes-dinamicos-detalhe.md)) |
| `BuyingGuide` | bloco `store-links` + `Store` cadastradas |
| `Alert` | bloco `callout` (variantes info/success/warning/danger) |
| `Steps` | bloco `steps` |
| `ButtonLayout` | componente de diagrama de controles parametrizável |
| `CardGrid`/`CardLink` | grid de catálogo + cards shadcn |

## 8.7 Anti-padrões a evitar

- Valores arbitrários espalhados em vez de tokens.
- `!important` para resolver especificidade.
- `style=` inline.
- `dark:` em cores semânticas (use tokens).
- Misturar config v3 (JS) com v4 (CSS-first).

## 8.8 Segurança de supply chain ao instalar

- Bloquear scripts de pós-instalação (`npm config set ignore-scripts true`).
- Período de carência para versões novas; auditar pacotes antes (ex.: Socket).
- Commitar lockfile; usar `npm ci` no CI. (Mais em [09 — Segurança](./09-seguranca.md).)
