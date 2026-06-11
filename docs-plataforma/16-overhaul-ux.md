# Overhaul de UX/UI — acompanhamento

Spec: `OVERHAUL-UX.md`. Direção: moderno com acento retro/gamer sutil, base shadcn,
premium, A/AA, mobile app-like. Ordem: **fundação + shell global → públicas → conta → admin**.

## Fase 1 — Fundação + shell global (em andamento)

### Entregue
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
  mobile. Antes: no mobile **não havia navegação alguma** (`.site-header__nav` é
  `hidden sm:flex`). Verificado: barra no rodapé (bottom=innerHeight), drawer abre,
  desktop inalterado (barra `display:none`, nav inline volta), **axe 0 violações**.

### Pendente nesta fase
- Refino de tokens/tipografia (escala tipográfica, acento mono em selos/dados,
  sombras/cantos suaves) em `globals.css`.
- Polimento do header desktop (densidade, busca, foco) e header compacto no mobile.
- Skip link "pular para o conteúdo" + landmark `<main id>`.

## Próximas fases
2. Páginas públicas (home, consoles lista/detalhe/comparar, guias, blog, perfil) +
   estados vazio/erro/carregando + SEO/HTML semântico.
3. Conta (painel, conta, notificações, missões, leaderboard).
4. Admin (~45 telas): shell, tabelas (shadcn Table), formulários robustos estilo IPB
   (Field/FieldGroup), modais/confirmações (AlertDialog) padronizados.
