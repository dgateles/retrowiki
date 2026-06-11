# Overhaul de UX/UI — acompanhamento

Spec: `OVERHAUL-UX.md`. Direção: moderno com acento retro/gamer sutil, base shadcn,
premium, A/AA, mobile app-like. Ordem: **fundação + shell global → públicas → conta → admin**.

## Fase 1 — Fundação + shell global ✓ CONCLUÍDA

- **Primitivos shadcn instalados**: badge, alert, tabs, sheet, tooltip, avatar,
  skeleton, separator, breadcrumb, switch, checkbox, radio-group, textarea, popover,
  table, scroll-area, drawer. (já existiam: button, card, dialog, dropdown-menu,
  input, label, select, pager). `TooltipProvider` adicionado aos `Providers`.
- **Navegação mobile app-like** (`src/components/layout/mobile-nav.tsx`): barra
  inferior fixa na thumb zone (Início/Consoles/Guias/Buscar/Menu, alvos ≥56px,
  estado ativo `aria-current`) + **drawer** (shadcn Sheet) com menu completo
  (Navegar + Conta/Sair ou Criar conta/Entrar). Renderizado como irmão do
  `<header>` (o header tem `backdrop-filter`, que cria containing block e jogava o
  `fixed` pro topo — corrigido). Conteúdo do `(main)` ganhou padding inferior no
  mobile. Antes: no mobile **não havia navegação alguma**. Verificado: barra no
  rodapé, drawer abre, desktop inalterado, **axe 0 violações**.
- **Tokens semânticos completados** em `globals.css`: `--success/-foreground`,
  `--warning/-foreground`, `--info/-foreground` (light+dark) mapeados no
  `@theme inline` → variantes consistentes de Alert/Badge nas próximas fases.
- **Polimento base premium**: `:focus-visible` elegante (outline 2px ring +offset),
  `::selection` esmeralda, font-smoothing, `text-wrap: balance` em títulos e
  `pretty` em parágrafos. Skip link "Pular para o conteúdo" agora visível só ao
  foco (já existia + `<main id="main">` em 19/21 páginas).
- Build de produção limpo; tokens resolvem; skip link e foco verificados no navegador.

## Fase 2 — Páginas públicas (em andamento)

### Home ✓
- **Hero**: glow radial esmeralda (depth) + eyebrow virou **pill mono uppercase**
  com borda esmeralda (acento retro). `text-wrap: balance` no título.
- **Cards de console** (`.device-card`): marca em **mono uppercase tracking**
  (acento de dados retro) + **microinteração no hover**: elevação (−2px), **brilho
  esmeralda** (ring + sombra colorida) e zoom suave (1.05) da imagem. Respeita
  `prefers-reduced-motion`.
- Aprendizados TW v4 reconfirmados: `group` não vai em `@apply`; utilitárias
  `-translate-*`/`scale-*` às vezes não compõem `transform` dentro de `@apply` em
  regra `:hover` aninhada → usei `transform` explícito. Cache do Turbopack precisou
  de `rm -rf .next` após o erro de `group`.
- Verificado no navegador (desktop): hero/pill/cards/hover OK, **axe 0 violações**,
  estrutura semântica limpa (banner/nav/main/region/contentinfo), build limpo.

### Consoles ✓
- Lista: estado vazio com CTA "Limpar filtros" (filtros já eram shadcn Select).
- Detalhe: marca + selos de "Emulação por sistema" em mono uppercase. Já era
  rico/semântico (JsonLd Product, dl/dt/dd, prós/contras).
- Comparar: níveis de emulação viram **selos coloridos mono** (emu-pill) na tabela
  — escaneamento visual; tabela rola no mobile sem estourar a página.

### Guias ✓
- Lista: selo de tipo mono uppercase + hover com sombra esmeralda + estado vazio
  com CTA ("Limpar filtros" / "Escrever guia").
- Detalhe (ArticleView, compartilhado com blog): selo de tipo mono; **corrigido
  aria-hidden-focus** (avatares decorativos focáveis → tabIndex=-1).

### Blog ✓
- Lista: estado vazio limpo (sem posts no seed). Post usa o mesmo ArticleView.

### Perfil ✓
- Números de stats em mono tabular (acento de dados).

Todas verificadas no navegador (desktop+mobile) com **axe 0 violações** e build limpo.
Commits: home+lista (5a411da), detalhe (0dcaff8), comparar (b9114c0), guias
(f6e0c72), artigo+fix a11y (63be736), perfil (c371cf9).

### Públicas restantes ✓
- Leaderboard: ranks + métricas em mono tabular esmeralda (cara de high-score).
- /missoes, /equipe, /buscar: já consistentes; verificadas (axe 0).
- /p/[slug]: PageRenderer já refinado no trabalho do construtor.
Commit leaderboard: 70a7726.

## Fase 3 — Auth + Conta ✓

### Auth (login/cadastro/esqueci/redefinir/confirmar/verificar) ✓
- Fundo com glow radial esmeralda (AuthShell compartilhado → 6 telas).
- Logo maior (pedido do dono). Título do card vira `<h1>` (corrige
  page-has-heading-one). Commit c9b46c5.

### Conta (painel/conta/notificações) ✓
- Painel: stat-cards em mono. Conta: corrigido dl/dt/dd inválido + input de
  upload sem nome (aria-label, beneficia todos os uploads do admin). Commit a3f5f95.

## Fase 4 — Admin (~45 telas) — PRÓXIMA
Shell do AdminCP, tabelas (shadcn Table), formulários robustos estilo IPB
(Field/FieldGroup), modais/confirmações (AlertDialog), estados. Maior volume.
3. Conta (painel, conta, notificações, missões, leaderboard).
4. Admin (~45 telas): shell, tabelas (shadcn Table), formulários robustos estilo IPB
   (Field/FieldGroup), modais/confirmações (AlertDialog) padronizados.
